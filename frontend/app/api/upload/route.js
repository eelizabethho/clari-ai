import { NextResponse } from "next/server";
import { uploadFileToS3 } from "@/services/upload.service";
import { getServerSession } from "next-auth";

export async function POST(request) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("audio");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }
    
    // Associate file with user for history tracking
    const userId = session.user.id || session.user.email;
    const result = await uploadFileToS3(file, userId);
    
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
