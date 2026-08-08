"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

interface CreateFolderDialogProps {
  parentFolderId: string | null;
  onCreated: () => void;
}

export function CreateFolderDialog({
  parentFolderId,
  onCreated,
}: CreateFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const folderName = name.trim();
    if (!folderName) return;
    setLoading(true);
    setError(null);

    try {
      await apiFetch("/folders", {
        method: "POST",
        body: JSON.stringify({
          name: folderName,
          parentFolderId,
        }),
      });
      setName("");
      setOpen(false);
      onCreated();
    } catch (err: any) {
      setError(
        err?.message || "Failed to create folder"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      setName("");
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="border-zinc-800 bg-black text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900 hover:text-white" />}>
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
        New Folder
      </DialogTrigger>
      <DialogContent
        className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
        <DialogHeader>

          <DialogTitle className="text-lg font-semibold">
            Create a new folder
          </DialogTitle>

          <p className="text-sm text-zinc-500">
            Create a folder to organize your files.
          </p>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div className="space-y-2">
            <label htmlFor="folder-name" className="text-sm font-medium text-zinc-300">
              Folder name
            </label>

            <Input
              id="folder-name"
              autoFocus
              placeholder="e.g. Documents"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              className="border-zinc-800 bg-black text-white placeholder:text-zinc-600 focus-visible:border-white focus-visible:ring-0"/>
          </div>
 
          {error && (
            <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
              <p className="text-xs text-zinc-400">
                {error}
              </p>
            </div>
          )}
 
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white">
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600">
              {loading ? "Creating..." : "Create folder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog >
  );
}