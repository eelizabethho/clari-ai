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
    accept: { "audio/*": [] },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
        ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"}
      `}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-blue-600">Drop the audio file here...</p>
      ) : (
        <p className="text-gray-700">Drag & drop an audio file here, or click to select</p>
      )}
    </div>
  );
}
