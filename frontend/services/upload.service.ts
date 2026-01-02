import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/aws/s3Client";

export interface UploadResult {
  success: boolean;
  fileName: string;
  url: string;
  error?: string;
}

export async function uploadFileToS3(file: File, userId?: string): Promise<UploadResult> {
  try {
    const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET_NAME'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    // Generate unique filename with timestamp to avoid collisions
    const fileName = `${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Store user ID in metadata so Lambda can associate transcript with user
    const metadata: Record<string, string> = {};
    if (userId) {
      metadata['user-id'] = userId;
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      Metadata: metadata,
    });

    await s3Client.send(command);
    
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    return {
      success: true,
      fileName,
      url: fileUrl,
    };
  } catch (error) {
    return {
      success: false,
      fileName: '',
      url: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

