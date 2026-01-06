import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/aws/s3Client";
import { getServerSession } from "next-auth";
import { dynamoClient } from "@/lib/dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

// Format AWS Transcribe items array into readable transcript with speaker labels
// Converts spk_0, spk_1 to "Speaker 1", "Speaker 2", etc.
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
    
    // New speaker detected - start a new paragraph
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
    
    // Build sentence word by word
    if (itemType === "punctuation") {
      currentSentence += content;
    } else {
      if (currentSentence && !currentSentence.endsWith(" ")) {
        currentSentence += " ";
      }
      currentSentence += content;
    }
    
    // End of sentence - flush to formatted text
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
      
      // Format with speaker labels if available, otherwise use plain transcript
      let formattedTranscript = transcriptData.transcript;
      if (transcriptData.items && transcriptData.items.length > 0) {
        formattedTranscript = formatTranscriptWithSpeakers(transcriptData.items);
      }
      
      // Try to get stored analysis from DynamoDB
      let storedAnalysis = null;
      try {
        const session = await getServerSession();
        if (session?.user) {
          const userId = session.user.id || session.user.email;
          const tableName = process.env.TRANSCRIPTS_TABLE_NAME || "clari-transcripts";
          
          const queryResponse = await dynamoClient.send(new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "userId = :userId",
            FilterExpression: "fileName = :fileName",
            ExpressionAttributeValues: {
              ":userId": userId,
              ":fileName": fileName,
            },
            ScanIndexForward: false,
            Limit: 1,
          }));

          if (queryResponse.Items && queryResponse.Items.length > 0 && queryResponse.Items[0].analysis) {
            storedAnalysis = queryResponse.Items[0].analysis;
          }
        }
      } catch (dbError) {
        // If we can't get analysis from DB, that's okay - we'll just not include it
        console.error("Failed to fetch analysis from DynamoDB:", dbError);
      }
      
      // Cache response for 5 minutes (transcripts don't change after creation)
      return NextResponse.json({
        success: true,
        transcript: formattedTranscript,
        rawTranscript: transcriptData.transcript,
        speakers: transcriptData.speakers,
        items: transcriptData.items,
        fileName: transcriptData.fileName,
        timestamp: transcriptData.timestamp,
        analysis: storedAnalysis, // Include stored analysis if available
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    } catch (s3Error: any) {
      // File doesn't exist yet - Lambda is still processing
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

