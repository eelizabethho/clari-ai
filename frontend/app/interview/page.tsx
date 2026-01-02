"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AudioDropzone from "@/components/ui/DropBox";
import Link from "next/link";

export default function InterviewPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        
        // Redirect to transcript page after successful upload
        // Lambda will process the file and save transcript to S3
        // The transcript page will poll for it
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

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-slate-50">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-2xl font-semibold text-center mb-4 text-black">
          Upload Your Interview Recording
        </h1>

        <AudioDropzone onFileSelect={handleFileSelect} />

        {file ? (
          <div className="mt-4 p-4 bg-green-50 border-2 border-green-400 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-green-800">
                ✅ File Ready to Upload
              </p>
              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                Ready
              </span>
            </div>
            <p className="font-medium text-green-900">{file.name}</p>
            <p className="text-xs text-green-700 mt-1">
              Size: {(file.size / 1024).toFixed(2)} KB | Type: {file.type || 'audio'}
            </p>

            <audio controls className="mt-3 w-full">
              <source src={URL.createObjectURL(file)} />
              Your browser does not support the audio element.
            </audio>
            
            <button
              onClick={() => setFile(null)}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-center">
            <p className="text-sm text-gray-500">No file selected - Please select an audio file</p>
          </div>
        )}

        {isUploading && (
          <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-md">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div>
                <p className="text-sm font-semibold text-blue-800">Uploading to S3...</p>
                <p className="text-xs text-blue-600 mt-1">Please wait, this may take a moment</p>
              </div>
            </div>
          </div>
        )}

        {uploadedUrl && !isUploading && (
          <div className="mt-4 p-4 bg-green-50 border-2 border-green-400 rounded-md">
            <div className="flex items-start gap-3">
              <div className="text-2xl">✅</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-green-800 mb-2">
                  🎉 Successfully Uploaded to S3!
                </p>
                <p className="text-xs text-green-700 mb-2">
                  Your file is now stored in your S3 bucket
                </p>
                <div className="bg-white p-2 rounded border border-green-200 mt-2">
                  <p className="text-xs font-mono text-green-800 break-all">
                    {uploadedUrl}
                  </p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(uploadedUrl)}
                  className="mt-2 text-xs text-green-700 hover:text-green-900 underline"
                >
                  Copy URL
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md">
            <p className="text-sm">❌ {error}</p>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:underline"
          >
            ← Back
          </Link>

          <button
            onClick={handleAnalyze}
            disabled={!file || isUploading}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              file && !isUploading
                ? "bg-[#2271B1] text-white hover:bg-[#1a5a8a] cursor-pointer shadow-md hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isUploading 
              ? "Uploading..." 
              : file 
                ? `Analyze Recording (${file.name.substring(0, 20)}...)` 
                : "Select a file first"}
          </button>
        </div>
      </div>
    </main>
  );
}