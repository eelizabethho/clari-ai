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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (transcriptId: string) => {
    if (!confirm("Are you sure you want to delete this transcript? This action cannot be undone.")) {
      return;
    }

    setDeletingId(transcriptId);
    try {
      const response = await fetch(`/api/transcripts?transcriptId=${encodeURIComponent(transcriptId)}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Remove the transcript from the local state
        setTranscripts(transcripts.filter((t) => t.transcriptId !== transcriptId));
      } else {
        setError(data.error || "Failed to delete transcript");
      }
    } catch (err) {
      console.error("Error deleting transcript:", err);
      setError("Failed to delete transcript");
    } finally {
      setDeletingId(null);
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
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 mb-2 text-lg font-medium">No transcripts yet</p>
            <p className="text-gray-500 text-sm mb-6">Get started by uploading your first interview recording</p>
            <Link
              href="/interview"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2271B1] text-white rounded-md hover:bg-[#1a5a8a] transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Recording
            </Link>
          </div>
        )}

        <div className="grid gap-4">
          {transcripts.map((transcript) => (
            <div
              key={transcript.transcriptId}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-200 border border-gray-100"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#2271B1]/10 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#2271B1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {transcript.fileName}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(transcript.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {transcript.speakers > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {transcript.speakers} speaker{transcript.speakers !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                    {transcript.transcript.substring(0, 150)}
                    {transcript.transcript.length > 150 ? "..." : ""}
                  </p>
                </div>
                <div className="flex-shrink-0 flex gap-2">
                  <Link
                    href={`/interview/transcript?fileName=${encodeURIComponent(transcript.fileName)}`}
                    className="px-4 py-2 bg-[#2271B1] text-white rounded-md hover:bg-[#1a5a8a] transition-colors text-sm font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(transcript.transcriptId)}
                    disabled={deletingId === transcript.transcriptId}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {deletingId === transcript.transcriptId ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

