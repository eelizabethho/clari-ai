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
  });

  const rootProps = getRootProps();
  const inputProps = getInputProps();

  return (
    <div
      {...rootProps}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:border-gray-400"}
      `}
    >
      <input {...inputProps} />
      {isDragActive ? (
        <p className="text-blue-600 font-medium">Drop the audio file here...</p>
      ) : (
        <div>
          <p className="text-gray-700 font-medium">Drag & drop an audio file here</p>
          <p className="text-gray-500 text-sm mt-2">or click to select</p>
        </div>
      )}
    </div>
  );
}
