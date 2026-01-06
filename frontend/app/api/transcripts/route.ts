import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dynamoClient } from "@/lib/dynamodb";
import { QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id || session.user.email;
    
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID) {
      return NextResponse.json(
        { error: "AWS credentials not configured" },
        { status: 500 }
      );
    }

    const tableName = process.env.TRANSCRIPTS_TABLE_NAME || "clari-transcripts";
    
    // Query DynamoDB for all transcripts belonging to this user
    // ScanIndexForward: false means newest first
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false,
    });

    const response = await dynamoClient.send(command);
    
    // Cache response for 1 minute (new uploads appear quickly)
    return NextResponse.json({
      success: true,
      transcripts: response.Items || [],
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error("Error fetching transcripts:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch transcripts",
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id || session.user.email;
    const { searchParams } = new URL(request.url);
    const transcriptId = searchParams.get("transcriptId");

    if (!transcriptId) {
      return NextResponse.json(
        { error: "Transcript ID is required" },
        { status: 400 }
      );
    }

    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID) {
      return NextResponse.json(
        { error: "AWS credentials not configured" },
        { status: 500 }
      );
    }

    const tableName = process.env.TRANSCRIPTS_TABLE_NAME || "clari-transcripts";
    
    // First, verify the transcript belongs to this user by querying it
    const queryCommand = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "userId = :userId AND transcriptId = :transcriptId",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":transcriptId": transcriptId,
      },
    });

    const queryResponse = await dynamoClient.send(queryCommand);
    
    if (!queryResponse.Items || queryResponse.Items.length === 0) {
      return NextResponse.json(
        { error: "Transcript not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the transcript
    const deleteCommand = new DeleteCommand({
      TableName: tableName,
      Key: {
        userId: userId,
        transcriptId: transcriptId,
      },
    });

    await dynamoClient.send(deleteCommand);
    
    return NextResponse.json({
      success: true,
      message: "Transcript deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting transcript:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete transcript",
        success: false,
      },
      { status: 500 }
    );
  }
}

