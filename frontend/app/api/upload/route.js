import { NextResponse } from "next/server";
import { uploadFileToS3 } from "@/services/upload.service";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }
    
    const result = await uploadFileToS3(file);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        fileName: result.fileName,
        url: result.url,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
