import { CloudFormationClient, CreateStackCommand, DescribeStacksCommand, UpdateStackCommand, DeleteStackCommand } from "@aws-sdk/client-cloudformation";
import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

const STACK_NAME = "clari-ai-stack";
const REGION = process.env.AWS_REGION || "us-east-1";

export async function POST() {
  const client = new CloudFormationClient({ region: REGION });
  
  // Get template file path (works from frontend directory)
  const templatePath = join(process.cwd(), "lib/aws/infra/s3-bucket.yaml");
  let templateBody: string;
  
  try {
    templateBody = readFileSync(templatePath, "utf-8");
  } catch (error) {
    return NextResponse.json({ 
      error: `Could not read template file: ${templatePath}` 
    }, { status: 500 });
  }

  try {
    // Try to create the stack
    try {
      await client.send(new CreateStackCommand({
        StackName: STACK_NAME,
        TemplateBody: templateBody,
      }));
      console.log("✅ Stack creation started");
    } catch (err: any) {
      if (err.name === "AlreadyExistsException") {
        // Stack exists, try to update
        console.log("📝 Stack exists, updating...");
        try {
          await client.send(new UpdateStackCommand({
            StackName: STACK_NAME,
            TemplateBody: templateBody,
          }));
          console.log("✅ Stack update started");
        } catch (updateErr: any) {
          if (updateErr.message?.includes("No updates")) {
            console.log("ℹ️ No updates needed");
          } else {
            throw updateErr;
          }
        }
      } else if (err.message?.includes("ROLLBACK_COMPLETE") || err.message?.includes("CREATE_FAILED")) {
        // Stack failed, delete it first
        console.log("🗑️ Deleting failed stack...");
        await client.send(new DeleteStackCommand({
          StackName: STACK_NAME,
        }));
        
        // Wait for deletion
        let deleteStatus = "";
        while (deleteStatus !== "DELETE_COMPLETE") {
          await new Promise(resolve => setTimeout(resolve, 5000));
          const deleteRes = await client.send(new DescribeStacksCommand({ 
            StackName: STACK_NAME 
          }));
          deleteStatus = deleteRes.Stacks?.[0]?.StackStatus || "";
          
          if (deleteStatus === "" || deleteStatus.includes("DELETE_COMPLETE")) {
            break;
          }
        }
        
        // Create again
        await client.send(new CreateStackCommand({
          StackName: STACK_NAME,
          TemplateBody: templateBody,
        }));
        console.log("✅ Stack creation started after cleanup");
      } else {
        throw err;
      }
    }

    // Wait for stack to be ready
    console.log("⏳ Waiting for stack to be ready...");
    let stackStatus = "";
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    while (stackStatus !== "CREATE_COMPLETE" && stackStatus !== "UPDATE_COMPLETE" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
      
      const res = await client.send(new DescribeStacksCommand({ 
        StackName: STACK_NAME 
      }));
      stackStatus = res.Stacks?.[0]?.StackStatus || "";
      
      console.log(`   Status: ${stackStatus} (attempt ${attempts}/${maxAttempts})`);
      
      if (stackStatus.includes("FAILED") || stackStatus === "ROLLBACK_COMPLETE") {
        throw new Error(`Stack failed with status: ${stackStatus}`);
      }
      
      if (stackStatus === "" || stackStatus.includes("DELETE")) {
        throw new Error("Stack was deleted or not found");
      }
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Stack creation timed out");
    }

    // Get outputs
    const res = await client.send(new DescribeStacksCommand({ 
      StackName: STACK_NAME 
    }));
    
    const bucketName = res.Stacks?.[0]?.Outputs?.find(
      o => o.OutputKey === "BucketName"
    )?.OutputValue;

    if (!bucketName) {
      throw new Error("Bucket name not found in stack outputs");
    }

    return NextResponse.json({ 
      success: true, 
      bucketName,
      message: "Stack deployed successfully"
    });
  } catch (error) {
    console.error("Deployment error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Deployment failed",
      success: false
    }, { status: 500 });
  }
}