import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/aws/s3Client";

export interface UploadResult {
  success: boolean;
  fileName: string;
  url: string;
  error?: string;
}

export async function uploadFileToS3(file: File): Promise<UploadResult> {
  try {
    // Check environment variables
    const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET_NAME'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    // Generate unique filename
    const fileName = `${Date.now()}-${file.name}`;
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create S3 upload command
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    // Upload to S3
    await s3Client.send(command);
    
    // Generate file URL
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

