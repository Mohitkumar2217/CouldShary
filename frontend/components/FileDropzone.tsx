"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { uploadFileChunked } from "@/lib/chunkedUpload";
import { getFileFingerprint, getUploadSession } from "@/lib/uploadSessionStore";

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

  console.log("Current folder:", folderId);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setProgress(0);
    setMessage(null);

    const fingerprint = getFileFingerprint(file);
    const existing = await getUploadSession(fingerprint);
    if (existing) {
      setMessage("Resuming previous upload...");
    }

    try {
      const result = await uploadFileChunked(file, (percent) => setProgress(percent), folderId);
      setMessage(`Uploaded:${result.file.name}`);
      onUploadComplete?.();
    } catch (err: any) {
      setMessage(`Error:${err.message}`);
    } finally {
      setUploading(false);
    }
  }, [folderId, onUploadComplete]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploading) return; // guard against double-submit, from the earlier 409 bug
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!uploading) setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30"
        }`}
    >
      <p className="mb-4 text-sm text-muted-foreground">
        {uploading ? `Uploading... ${progress}%` : "Drag and drop a file here, or"}
      </p>
      <input
        type="file"
        id="file-input"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && !uploading) uploadFile(file);
        }}
      />
      <Button
        variant="outline"
        disabled={uploading}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        Browse Files
      </Button>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}