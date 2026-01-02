import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/aws/s3Client";

function formatTranscriptWithSpeakers(items: any[]): string {
  if (!items || items.length === 0) return "";
  
  let formatted = "";
  let currentSpeaker: string | null = null;
  let currentSentence = "";
  
  for (const item of items) {
    const speakerLabel = item.speaker_label;
    const content = item.alternatives?.[0]?.content || "";
    const itemType = item.type;
    
    if (!content && itemType !== "punctuation") continue;
    
    if (speakerLabel && speakerLabel !== currentSpeaker) {
      if (currentSentence.trim()) {
        formatted += currentSentence.trim();
        currentSentence = "";
      }
      
      const speakerNum = speakerLabel.replace("spk_", "");
      const speakerName = `Speaker ${parseInt(speakerNum) + 1}`;
      
      if (formatted) {
        formatted += "\n\n";
      }
      formatted += `${speakerName}: `;
      currentSpeaker = speakerLabel;
    }
    
    if (itemType === "punctuation") {
      currentSentence += content;
    } else {
      if (currentSentence && !currentSentence.endsWith(" ")) {
        currentSentence += " ";
      }
      currentSentence += content;
    }
    
    if (content.match(/[.!?]$/)) {
      formatted += currentSentence.trim();
      currentSentence = "";
    }
  }
  
  if (currentSentence.trim()) {
    formatted += currentSentence.trim();
  }
  
  return formatted.trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("fileName");

  if (!fileName) {
    return NextResponse.json(
      { error: "fileName parameter is required" },
      { status: 400 }
    );
  }

  try {
    const transcriptKey = `transcripts/${fileName}-transcript.json`;
    
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: transcriptKey,
      });
      
      const response = await s3Client.send(command);
      const transcriptData = JSON.parse(await response.Body!.transformToString());
      
      let formattedTranscript = transcriptData.transcript;
      if (transcriptData.items && transcriptData.items.length > 0) {
        formattedTranscript = formatTranscriptWithSpeakers(transcriptData.items);
      }
      
      return NextResponse.json({
        success: true,
        transcript: formattedTranscript,
        rawTranscript: transcriptData.transcript,
        speakers: transcriptData.speakers,
        items: transcriptData.items,
        fileName: transcriptData.fileName,
        timestamp: transcriptData.timestamp,
      });
    } catch (s3Error: any) {
      if (s3Error.name === "NoSuchKey" || s3Error.Code === "NoSuchKey") {
        return NextResponse.json({
          success: false,
          ready: false,
          message: "Transcript is still being processed. Please wait...",
        });
      }
      throw s3Error;
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch transcript",
        success: false,
      },
      { status: 500 }
    );
  }
}

