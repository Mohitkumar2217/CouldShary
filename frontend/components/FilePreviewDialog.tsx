"use client";

import { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

interface FilePreviewDialogProps {
    fileId: string;
    fileName: string;
    mimeType: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FilePreviewDialog({
    fileId,
    fileName,
    mimeType,
    open,
    onOpenChange,
}: FilePreviewDialogProps) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPreview = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await apiFetch(`/files/${fileId}/download`);
            setUrl(data.url);
        } catch (err: any) {
            setError(err?.message || "Unable to load preview");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (value: boolean) => {
        onOpenChange(value);

        if (value && !url) {
            loadPreview();
        }
    };

    const isImage = mimeType.startsWith("image/");
    const isPdf = mimeType === "application/pdf";

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-hidden border-zinc-800 bg-black p-0 text-white sm:max-w-4xl ">
                <DialogHeader className="flex flex-row items-center justify-between border-b border-zinc-800 px-5 py-4 ">
                    <div className="min-w-0">
                        <DialogTitle className="truncate pr-8 text-sm font-medium text-white ">
                            {fileName}
                        </DialogTitle>

                        <p className="mt-1 text-xs text-zinc-600">
                            {mimeType}
                        </p>

                    </div>
                </DialogHeader>

                <div className="flex min-h-[400px] max-h-[calc(90vh-80px)] items-center justify-center overflow-auto bg-zinc-950 p-5 ">
                    {loading && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white " />
                            <p className="text-sm text-zinc-500">
                                Loading preview...
                            </p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex max-w-sm flex-col items-center text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-black " >
                                <svg className="h-5 w-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                                    <circle cx="12" cy="12" r="9" />
                                    <path strokeLinecap="round" d="M12 8v4" />
                                    <path strokeLinecap="round" d="M12 16h.01" />
                                </svg>
                            </div>

                            <p className="text-sm font-medium text-white">
                                Preview unavailable
                            </p>

                            <p className="mt-1 text-xs text-zinc-600">
                                {error}
                            </p>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadPreview}
                                className="mt-4 border-zinc-800 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white">
                                Try again
                            </Button>
                        </div>
                    )}

                    {!loading && !error && url && isImage && (
                        <div className="flex w-full items-center justify-center">
                            <img src={url} alt={fileName} className="max-h-[70vh] max-w-full rounded-lg border border-zinc-800 object-contain" />
                        </div>
                    )}

                    {!loading && !error && url && isPdf && (
                        <iframe src={url} title={fileName} className="h-[70vh] w-full rounded-lg border border-zinc-800 bg-white" />
                    )}

                    {!loading && !error && url && !isImage && !isPdf &&
                        <div className="flex max-w-sm flex-col items-center text-center">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-800 bg-black ">
                                <svg className="h-6 w-6 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h8l4 4v14H6z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                                </svg>
                            </div>

                            <p className="text-sm font-medium text-white">
                                Preview not available
                            </p>

                            <p className="mt-2 text-xs leading-5 text-zinc-600">
                                This file type cannot be previewed in the
                                browser.
                            </p>

                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-5 inline-flex h-9 items-center rounded-md bg-white px-4 text-xs font-medium text-black transition-colors hover:bg-zinc-200 ">
                                Open file
                            </a>
                        </div>
                    }
                </div>
            </DialogContent>
        </Dialog>
    );
}