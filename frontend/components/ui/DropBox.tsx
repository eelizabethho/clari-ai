"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

type DropBoxProps = {
  onFileSelect: (file: File) => void;
};

export default function DropBox({ onFileSelect }: DropBoxProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
    noClick: false,
    noKeyboard: false,
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB max (AWS Transcribe limit)
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.ogg', '.amr', '.m4a'],
      'video/*': ['.mp4', '.mov', '.webm', '.mpg', '.mpeg'],
    },
  });

  const rootProps = getRootProps();
  const inputProps = getInputProps();

  return (
    <div
      {...rootProps}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
        ${isDragActive ? "border-[#2271B1] bg-blue-50 scale-[1.02]" : "border-gray-300 bg-gray-50 hover:border-[#2271B1] hover:bg-blue-50/30"}
      `}
    >
      <input {...inputProps} />
      {isDragActive ? (
        <div className="space-y-2">
          <svg className="w-12 h-12 mx-auto text-[#2271B1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-[#2271B1] font-semibold text-lg">Drop your file here</p>
        </div>
      ) : (
        <div className="space-y-3">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div>
            <p className="text-gray-700 font-semibold text-lg">Drag & drop your interview recording</p>
            <p className="text-gray-500 text-sm mt-2">or click to browse</p>
            <p className="text-xs text-gray-400 mt-3">Supports: MP3, MP4, WAV, MOV, and more</p>
          </div>
        </div>
      )}
    </div>
  );
}
