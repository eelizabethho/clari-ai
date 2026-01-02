import { CloudFormationClient, CreateStackCommand, DescribeStacksCommand, UpdateStackCommand, DeleteStackCommand } from "@aws-sdk/client-cloudformation";
import { LambdaClient, UpdateFunctionCodeCommand, GetFunctionCommand, AddPermissionCommand } from "@aws-sdk/client-lambda";
import { S3Client, PutBucketNotificationConfigurationCommand } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync, statSync, createReadStream } from "fs";
import { join } from "path";
import { createWriteStream } from "fs";
import { execSync } from "child_process";
import archiver from "archiver";
import { NextResponse } from "next/server";

const STACK_NAME = "clari-ai-lambda-stack";
const REGION = process.env.AWS_REGION || "us-east-1";

// Package Lambda code into a zip file
async function packageLambdaCode(): Promise<string> {
  const lambdaDir = join(process.cwd(), "..", "infra", "lambda");
  const zipPath = join(process.cwd(), ".next", "lambda-deployment.zip");
  
  // Ensure .next directory exists
  const nextDir = join(process.cwd(), ".next");
  try {
    execSync(`mkdir -p "${nextDir}"`, { stdio: 'ignore' });
  } catch (e) {
    // Directory might already exist
  }

  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`Lambda code packaged: ${archive.pointer()} bytes`);
      resolve(zipPath);
    });

    archive.on("error", (err: Error) => reject(err));
    archive.pipe(output);

    // Add all files from lambda directory
    try {
      const files = readdirSync(lambdaDir);
      files.forEach((file) => {
        const filePath = join(lambdaDir, file);
        const stat = statSync(filePath);
        if (stat.isFile()) {
          archive.file(filePath, { name: file });
        } else if (stat.isDirectory()) {
          archive.directory(filePath, file);
        }
      });
      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

async function updateLambdaCode(functionName: string, zipPath: string) {
  const lambdaClient = new LambdaClient({ region: REGION });
  const zipBuffer = readFileSync(zipPath);

  await lambdaClient.send(
    new UpdateFunctionCodeCommand({
      FunctionName: functionName,
      ZipFile: zipBuffer,
    })
  );
  console.log("Lambda code updated");
}

async function connectS3ToLambda(bucketName: string, lambdaArn: string) {
  const s3Client = new S3Client({ region: REGION });
  const lambdaClient = new LambdaClient({ region: REGION });

  try {
    await lambdaClient.send(
      new AddPermissionCommand({
        FunctionName: lambdaArn.split(":function:")[1],
        Principal: "s3.amazonaws.com",
        Action: "lambda:InvokeFunction",
        SourceArn: `arn:aws:s3:::${bucketName}`,
        StatementId: `s3-trigger-${Date.now()}`,
      })
    );
    console.log("Lambda permission added for S3");
  } catch (error: any) {
    if (!error.message?.includes("already exists")) {
      console.warn("Could not add Lambda permission:", error.message);
    }
  }

  await s3Client.send(
    new PutBucketNotificationConfigurationCommand({
      Bucket: bucketName,
      NotificationConfiguration: {
        LambdaFunctionConfigurations: [
          {
            LambdaFunctionArn: lambdaArn,
            Events: ["s3:ObjectCreated:*"],
          },
        ],
      },
    })
  );
  console.log("S3 bucket connected to Lambda");
}

export async function POST() {
  const EXISTING_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
  
  if (!EXISTING_BUCKET_NAME) {
    return NextResponse.json(
      {
        error: "AWS_S3_BUCKET_NAME environment variable is required",
        success: false,
      },
      { status: 400 }
    );
  }

  const cfClient = new CloudFormationClient({ region: REGION });

  // Get template file path
  const templatePath = join(process.cwd(), "lib/aws/infra/lambda-stack.yaml");
  let templateBody: string;

  try {
    templateBody = readFileSync(templatePath, "utf-8");
  } catch (error) {
    return NextResponse.json(
      {
        error: `Could not read template file: ${templatePath}`,
      },
      { status: 500 }
    );
  }

  try {
    console.log("Deploying Lambda function...");
    let stackExists = false;
    let stackStatus = "";
    
    try {
      const describeRes = await cfClient.send(new DescribeStacksCommand({ StackName: STACK_NAME }));
      stackExists = true;
      stackStatus = describeRes.Stacks?.[0]?.StackStatus || "";
      
      if (stackStatus === "ROLLBACK_COMPLETE" || stackStatus === "CREATE_FAILED" || stackStatus === "UPDATE_ROLLBACK_COMPLETE") {
        console.log(`Stack is in failed state (${stackStatus}), deleting...`);
        await cfClient.send(new DeleteStackCommand({ StackName: STACK_NAME }));
        
        let deleteStatus = stackStatus;
        while (deleteStatus !== "DELETE_COMPLETE" && !deleteStatus.includes("DELETE")) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          try {
            const deleteRes = await cfClient.send(new DescribeStacksCommand({ StackName: STACK_NAME }));
            deleteStatus = deleteRes.Stacks?.[0]?.StackStatus || "";
          } catch (err: any) {
            if (err.name === "ValidationError" && err.message.includes("does not exist")) {
              deleteStatus = "DELETE_COMPLETE";
              break;
            }
            throw err;
          }
        }
        stackExists = false;
      }
    } catch (error: any) {
      if (error.name !== "ValidationError" || !error.message.includes("does not exist")) {
        throw error;
      }
    }

    if (stackExists) {
      console.log("Stack exists, updating...");
      try {
        await cfClient.send(
          new UpdateStackCommand({
            StackName: STACK_NAME,
            TemplateBody: templateBody,
            Capabilities: ["CAPABILITY_IAM"],
            Parameters: [
              {
                ParameterKey: "ExistingBucketName",
                ParameterValue: EXISTING_BUCKET_NAME,
              },
              {
                ParameterKey: "OpenAIApiKey",
                ParameterValue: process.env.OPENAI_API_KEY || "",
              },
            ],
          })
        );
        console.log("Stack update started");
      } catch (updateErr: any) {
        if (updateErr.message?.includes("No updates")) {
          console.log("No updates needed to stack");
        } else {
          throw updateErr;
        }
      }
    } else {
      console.log("Creating new stack...");
      await cfClient.send(
        new CreateStackCommand({
          StackName: STACK_NAME,
          TemplateBody: templateBody,
          Capabilities: ["CAPABILITY_IAM"],
          Parameters: [
            {
              ParameterKey: "ExistingBucketName",
              ParameterValue: EXISTING_BUCKET_NAME,
            },
            {
              ParameterKey: "OpenAIApiKey",
              ParameterValue: process.env.OPENAI_API_KEY || "",
            },
          ],
        })
      );
      console.log("Stack creation started");
    }

    console.log("Waiting for stack to be ready...");
    let currentStackStatus = "";
    let attempts = 0;
    const maxAttempts = 60;

    while (
      currentStackStatus !== "CREATE_COMPLETE" &&
      currentStackStatus !== "UPDATE_COMPLETE" &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;

      const res = await cfClient.send(
        new DescribeStacksCommand({ StackName: STACK_NAME })
      );
      currentStackStatus = res.Stacks?.[0]?.StackStatus || "";

      if (currentStackStatus.includes("FAILED") || currentStackStatus === "ROLLBACK_COMPLETE") {
        throw new Error(`Stack failed with status: ${currentStackStatus}`);
      }
    }

    if (attempts >= maxAttempts) {
      throw new Error("Stack creation timed out");
    }

    const res = await cfClient.send(
      new DescribeStacksCommand({ StackName: STACK_NAME })
    );
    const lambdaArn =
      res.Stacks?.[0]?.Outputs?.find((o) => o.OutputKey === "LambdaFunctionArn")
        ?.OutputValue;
    const lambdaName =
      res.Stacks?.[0]?.Outputs?.find(
        (o) => o.OutputKey === "LambdaFunctionName"
      )?.OutputValue;

    if (!lambdaArn || !lambdaName) {
      throw new Error("Lambda ARN or name not found in stack outputs");
    }

    console.log(`Lambda created: ${lambdaName}`);

    console.log("Packaging Lambda code...");
    const zipPath = await packageLambdaCode();
    await updateLambdaCode(lambdaName, zipPath);

    console.log("Connecting S3 bucket to Lambda...");
    await connectS3ToLambda(EXISTING_BUCKET_NAME, lambdaArn);

    return NextResponse.json({
      success: true,
      lambdaArn,
      lambdaName,
      bucketName: EXISTING_BUCKET_NAME,
      message: `Lambda deployed and connected to S3 bucket: ${EXISTING_BUCKET_NAME}`,
    });
  } catch (error) {
    console.error("Deployment error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Deployment failed",
        success: false,
      },
      { status: 500 }
    );
  }
}