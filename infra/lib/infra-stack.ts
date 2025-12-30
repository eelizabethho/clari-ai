import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as path from 'path';

/**
 * InfraStack
 *
 * This stack sets up:
 * 1. An S3 bucket where users upload audio files
 * 2. A Lambda function that processes those uploads
 * 3. An event trigger so the Lambda runs whenever a file is added
 */
export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * S3 bucket used for audio uploads.
     * Files added here will trigger the transcription Lambda.
     */
    const bucket = new s3.Bucket(this, 'AudioUploadsBucket', {
      // Automatically clean up resources when stack is deleted (dev-friendly)
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    /**
     * Lambda function responsible for:
     * - Downloading the uploaded file from S3
     * - Sending it to OpenAI Whisper
     * - Handling the transcription output
     */
    const transcribeLambda = new lambda.Function(this, 'TranscribeLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',

      // CDK bundles everything in /lambda and deploys it as the Lambda code
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda')),

      // Give Lambda enough time and memory for audio processing
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,

      // Environment variables available inside the Lambda runtime
          environment: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      BUCKET_NAME: bucket.bucketName,
    },

    });

    /**
     * Allow the Lambda to read files from the S3 bucket
     */
    bucket.grantRead(transcribeLambda);

    /**
     * Automatically trigger the Lambda whenever a new file
     * is uploaded to the "uploads/" folder in the bucket.
     */
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(transcribeLambda),
      { prefix: 'uploads/' }
    );
  }
}
