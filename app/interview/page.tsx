"use client";

import { useState } from "react";
import AudioDropzone from "@/components/DropBox";
import Link from "next/link";

export default function InterviewPage() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-slate-50">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-2xl font-semibold text-center mb-4 text-black">
          Upload Your Interview Recording
        </h1>

        <AudioDropzone onFileSelect={setFile} />

        {file && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Selected file:
            </p>
            <p className="font-medium">{file.name}</p>

            <audio controls className="mt-2 w-full">
              <source src={URL.createObjectURL(file)} />
            </audio>
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
            disabled={!file}
            className="bg-[#2271B1] text-white px-6 py-2 rounded-md disabled:opacity-50"
          >
            Analyze Recording
          </button>
        </div>
      </div>
    </main>
  );
}
