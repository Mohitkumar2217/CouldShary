"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

export function FileDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:7000/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setMessage(`Uploaded: ${data.file.name}`);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30"
      }`}
    >
      <p className="mb-4 text-sm text-muted-foreground">
        {uploading ? "Uploading..." : "Drag and drop a file here, or"}
      </p>
      <input
        type="file"
        id="file-input"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
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