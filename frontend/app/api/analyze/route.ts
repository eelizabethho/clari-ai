import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { dynamoClient } from "@/lib/dynamodb";
import { UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: Request) {
  try {
    if (!openai) {
      return NextResponse.json(
        { 
          error: "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.",
          success: false 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { transcript, fileName } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    if (typeof transcript !== 'string' || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: "Transcript must be a non-empty string" },
        { status: 400 }
      );
    }

    // Analyze interview performance and return structured feedback
    const analysisPrompt = `You are an expert interview coach analyzing an interview transcript. Provide detailed feedback on the candidate's performance.

Analyze the following transcript and provide feedback in JSON format with these categories:
1. Overall Performance (score 1-10, brief summary)
2. Strengths (array of 3-5 specific strengths)
3. Areas for Improvement (array of 3-5 specific areas)
4. Communication Skills (score 1-10, detailed feedback)
5. Clarity & Articulation (score 1-10, detailed feedback)
6. Pace & Pauses (score 1-10, detailed feedback)
7. Confidence Level (score 1-10, detailed feedback)
8. Professionalism (score 1-10, detailed feedback)
9. Specific Recommendations (array of 3-5 actionable recommendations)

Return ONLY valid JSON in this exact format:
{
  "overall": {
    "score": 8,
    "summary": "Brief overall assessment"
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area 1", "area 2", "area 3"],
  "communication": {
    "score": 8,
    "feedback": "Detailed feedback on communication"
  },
  "clarity": {
    "score": 7,
    "feedback": "Detailed feedback on clarity"
  },
  "pace": {
    "score": 8,
    "feedback": "Detailed feedback on pace"
  },
  "confidence": {
    "score": 7,
    "feedback": "Detailed feedback on confidence"
  },
  "professionalism": {
    "score": 9,
    "feedback": "Detailed feedback on professionalism"
  },
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Transcript:
${transcript}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert interview coach. Provide detailed, constructive feedback in JSON format only.",
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const analysisText = completion.choices[0]?.message?.content || "{}";
    let analysis;

    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse analysis response");
      }
    }

    // Save analysis to DynamoDB if fileName is provided
    if (fileName) {
      try {
        const session = await getServerSession();
        if (session?.user) {
          const userId = (session.user as any).id || session.user.email;
          const tableName = process.env.TRANSCRIPTS_TABLE_NAME || "clari-transcripts";
          
          // Find the transcript by fileName and update it with analysis
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

          if (queryResponse.Items && queryResponse.Items.length > 0) {
            const transcriptItem = queryResponse.Items[0];
            await dynamoClient.send(new UpdateCommand({
              TableName: tableName,
              Key: {
                userId: userId,
                transcriptId: transcriptItem.transcriptId,
              },
              UpdateExpression: "SET analysis = :analysis",
              ExpressionAttributeValues: {
                ":analysis": analysis,
              },
            }));
          }
        }
      } catch (dbError) {
        // Don't fail the request if saving to DB fails, just log it
        console.error("Failed to save analysis to DynamoDB:", dbError);
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    
    let errorMessage = "Failed to analyze transcript";
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes("API key") || error.message.includes("Invalid API key")) {
        errorMessage = "OpenAI API key is invalid or missing. Please check your .env.local file.";
        statusCode = 401;
      } else if (error.message.includes("rate limit") || error.message.includes("429")) {
        errorMessage = "OpenAI API rate limit exceeded. Please try again in a few minutes.";
        statusCode = 429;
      } else if (error.message.includes("insufficient_quota") || error.message.includes("quota")) {
        errorMessage = "OpenAI API quota exceeded. Please check your account balance.";
        statusCode = 402;
      } else if (error.message.includes("model")) {
        errorMessage = `OpenAI model error: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? {
              message: error.message,
              stack: error.stack,
              name: error.name
            } : String(error))
          : undefined,
      },
      { status: statusCode }
    );
  }
}

