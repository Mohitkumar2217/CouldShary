"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";

export function FilePreviewDialog({
  fileId, fileName, mimeType, open, onOpenChange,
}: {
  fileId: string; fileName: string; mimeType: string; open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/files/${fileId}/download`);
      setUrl(data.url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (o && !url) loadPreview(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{fileName}</DialogTitle>
        </DialogHeader>
        {loading && <p className="text-sm text-muted-foreground">Loading preview...</p>}
        {url && mimeType.startsWith("image/") && (
          <img src={url} alt={fileName} className="max-h-[70vh] mx-auto rounded" />
        )}
        {url && mimeType === "application/pdf" && (
          <iframe src={url} className="w-full h-[70vh] rounded border" />
        )}
        {url && !mimeType.startsWith("image/") && mimeType !== "application/pdf" && (
          <p className="text-sm text-muted-foreground">No preview available for this file type — use Download instead.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}