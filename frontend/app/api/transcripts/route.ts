import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dynamoClient } from "@/lib/dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

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
    
    return NextResponse.json({
      success: true,
      transcripts: response.Items || [],
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

