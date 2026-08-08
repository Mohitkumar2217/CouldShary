"use client";

import { useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { uploadFileChunked } from "@/lib/chunkedUpload";
import {
  getFileFingerprint,
  getUploadSession,
} from "@/lib/uploadSessionStore";

type UploadDialogProps = {
  folderId?: string;
  onUploadComplete?: () => void;
};

export function FileDropzone({
  folderId,
  onUploadComplete,
}: UploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setProgress(0);
      setMessage(null);

      const fingerprint = getFileFingerprint(file);
      const existing = await getUploadSession(fingerprint);

      if (existing) {
        setMessage("Resuming previous upload...");
      }

      try {
        const result = await uploadFileChunked(
          file,
          (percent) => setProgress(percent),
          folderId
        );

        setMessage(`Uploaded:${result.file.name}`);
        onUploadComplete?.();
      } catch (err: any) {
        try {
          const parsed = JSON.parse(err.message);
          setMessage(parsed.error || err.message);
        } catch {
          setMessage(err.message);
        }
      } finally {
        setUploading(false);
      }
    },
    [folderId, onUploadComplete]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    setIsDragging(false);
    if (uploading) return;
    const file = e.dataTransfer.files[0];

    if (file) {
      uploadFile(file);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file && !uploading) {
      uploadFile(file);
    }

    // Allows selecting the same file again
    e.target.value = "";
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) {
            setIsDragging(true);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`relative flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-all duration-200 ${isDragging ? "border-white bg-zinc-900" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"} ${uploading ? "cursor-not-allowed opacity-80" : "cursor-default"}`}
      >
        <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${isDragging ? "border-zinc-600 bg-zinc-800" : "border-zinc-800 bg-black"}`}>
          {uploading ? (
            <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none" >
              <circle cx="12" cy="12" r="9" className="opacity-20" stroke="currentColor" strokeWidth="2" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m7 9 5-5 5 5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 20h14" />
            </svg>
          )}
        </div>

        {uploading ? (
          <>
            <p className="text-sm font-medium text-white">
              Uploading file
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Please keep this window open
            </p>
          </>
        ) : isDragging ? (
          <>
            <p className="text-sm font-medium text-white">
              Drop your file here
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Release to start uploading
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-white">
              Drag and drop your file here
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              or select a file from your computer
            </p>
          </>
        )}

        {uploading && (
          <div className="mt-6 w-full max-w-sm">

            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-zinc-600">
                Upload progress
              </span>

              <span className="text-xs font-medium text-zinc-300">
                {progress}%
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

          </div>
        )}

        {!uploading && (
          <div className="mt-6">
            <input type="file" id="file-input" className="hidden" onChange={handleFileChange} />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("file-input")?.click()}
              className="border-zinc-800 bg-black text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900 hover:text-white">
              Browse files
            </Button>

          </div>
        )}

        {!uploading && (
          <p className="mt-4 text-[11px] text-zinc-700">
            Your upload will be securely processed in chunks
          </p>
        )}
      </div>

      {message && (
        <div className={`mt-3 rounded-lg border px-4 py-3 ${message.startsWith("Error:") ? "border-zinc-800 bg-zinc-950" : "border-zinc-800 bg-zinc-950"}`}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {message.startsWith("error") ? (
                <svg className="h-4 w-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" >
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" d="M12 8v4" />
                  <path strokeLinecap="round" d="M12 16h.01" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" >
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8 12 2.5 2.5L16 9" />
                </svg>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              {message}
            </p>

          </div>
        </div>
      )}

    </div>
  );
}