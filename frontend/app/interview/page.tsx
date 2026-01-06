"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AudioDropzone from "@/components/ui/DropBox";
import Link from "next/link";

export default function InterviewPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect to sign-in if user isn't authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/interview");
    }
  }, [status, router]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile || !(selectedFile instanceof File)) {
      return;
    }
    setFile(selectedFile);
    setError(null);
    setUploadedUrl(null);
  }, []);

  async function handleAnalyze() {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadedUrl(null);

    try {
      const formData = new FormData();
      formData.append('audio', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUploadedUrl(data.url);
        
        // Redirect to transcript page - Lambda will process the file in the background
        const fileName = data.fileName || file.name;
        router.push(`/interview/transcript?fileName=${encodeURIComponent(fileName)}`);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (error) {
      setError(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {status === "loading" ? "Loading..." : "Redirecting to sign in..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-slate-50">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-2xl font-semibold text-center mb-4 text-black">
          Upload Your Interview Recording
        </h1>

        <AudioDropzone onFileSelect={handleFileSelect} />

        {file ? (
          <div className="mt-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-semibold text-green-800">
                  File Ready
                </p>
              </div>
              <span className="text-xs bg-green-200 text-green-800 px-3 py-1 rounded-full font-medium">
                Ready
              </span>
            </div>
            <p className="font-semibold text-gray-900 mb-2 truncate">{file.name}</p>
            <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {file.type || 'audio'}
              </span>
            </div>

            <audio controls className="mt-3 w-full rounded-md">
              <source src={URL.createObjectURL(file)} />
              Your browser does not support the audio element.
            </audio>
            
            <button
              onClick={() => setFile(null)}
              className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove file
            </button>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p className="text-sm text-gray-500">No file selected</p>
          </div>
        )}

        {isUploading && (
          <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-md">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div>
                <p className="text-sm font-semibold text-blue-800">Uploading your file...</p>
                <p className="text-xs text-blue-600 mt-1">Please wait, this may take a moment</p>
              </div>
            </div>
          </div>
        )}

        {uploadedUrl && !isUploading && (
          <div className="mt-4 p-4 bg-green-50 border-2 border-green-400 rounded-md">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-green-800 mb-2">
                  File uploaded successfully
                </p>
                <p className="text-xs text-green-700 mb-2">
                  Your file is being processed. Redirecting to transcript...
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Link
            href="/interview/history"
            className="text-sm text-gray-500 hover:underline"
          >
            View Past Transcripts
          </Link>

          <button
            onClick={handleAnalyze}
            disabled={!file || isUploading}
            className={`px-6 py-3 rounded-md font-medium transition-all flex items-center gap-2 ${
              file && !isUploading
                ? "bg-[#2271B1] text-white hover:bg-[#1a5a8a] cursor-pointer shadow-md hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : file ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analyze Recording
              </>
            ) : (
              "Select a file first"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}