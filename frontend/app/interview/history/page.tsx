"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Transcript {
  transcriptId: string;
  fileName: string;
  transcript: string;
  speakers: number;
  timestamp: string;
  s3Key: string;
}

export default function TranscriptHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/interview/history");
    } else if (status === "authenticated") {
      fetchTranscripts();
    }
  }, [status, router]);

  const fetchTranscripts = async () => {
    try {
      const response = await fetch("/api/transcripts");
      const data = await response.json();

      if (data.success) {
        setTranscripts(data.transcripts || []);
      } else {
        setError(data.error || "Failed to load transcripts");
      }
    } catch (err) {
      console.error("Error fetching transcripts:", err);
      setError("Failed to load transcripts");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your transcripts...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <main className="min-h-screen px-6 bg-slate-50 py-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-black">
            My Transcripts
          </h1>
          <div className="flex gap-4">
            <Link
              href="/interview"
              className="px-4 py-2 bg-[#2271B1] text-white rounded-md hover:bg-[#1a5a8a] transition-colors"
            >
              Upload New
            </Link>
            {session?.user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {session.user.name || session.user.email}
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-md mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {transcripts.length === 0 && !isLoading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No transcripts yet.</p>
            <Link
              href="/interview"
              className="text-[#2271B1] hover:underline"
            >
              Upload your first interview recording
            </Link>
          </div>
        )}

        <div className="grid gap-4">
          {transcripts.map((transcript) => (
            <div
              key={transcript.transcriptId}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {transcript.fileName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {new Date(transcript.timestamp).toLocaleString()}
                  </p>
                  {transcript.speakers > 0 && (
                    <p className="text-xs text-gray-500 mb-3">
                      {transcript.speakers} speaker{transcript.speakers !== 1 ? 's' : ''} detected
                    </p>
                  )}
                  <p className="text-gray-700 text-sm line-clamp-3">
                    {transcript.transcript.substring(0, 200)}
                    {transcript.transcript.length > 200 ? "..." : ""}
                  </p>
                </div>
                <Link
                  href={`/interview/transcript?fileName=${encodeURIComponent(transcript.fileName)}`}
                  className="ml-4 px-4 py-2 bg-[#2271B1] text-white rounded-md hover:bg-[#1a5a8a] transition-colors text-sm"
                >
                  View Full
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

