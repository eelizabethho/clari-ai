import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1) Import existing bucket by name
    const bucket = s3.Bucket.fromBucketName(this, "ExistingBucket", "clari-ai-bucket");

    // 2) Your Lambda (or import it if already created)
    const transcribeLambda = new lambda.Function(this, "TranscribeLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda"),
      timeout: cdk.Duration.minutes(5),
      environment: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
      },
    });

    // 3) Allow Lambda to read from that bucket
    bucket.grantRead(transcribeLambda);

    // 4) Trigger Lambda when an object is created in the bucket
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(transcribeLambda)
    );
  }
}
