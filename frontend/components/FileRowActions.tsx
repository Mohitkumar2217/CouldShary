"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

interface FolderOption {
  id: string;
  name: string;
}

interface FileRowActionsProps {
  fileId: string;
  currentFolderId: string | null;
  onChanged: () => void;
}

export function FileRowActions({
  fileId,
  currentFolderId,
  onChanged,
}: FileRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await apiFetch(`/files/${fileId}`, {
        method: "DELETE",
      });

      setDeleteOpen(false);
      onChanged();
    } catch (err: any) {
      setError(err?.message || "Failed to delete file");
    } finally {
      setLoading(false);
    }
  };
  const loadRootFolders = async () => {
    setError(null);

    try {
      const data = await apiFetch("/folders");
      setFolders(data.folders ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load folders");
    }
  };

  const handleMove = async (newFolderId: string | null) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/folders/files/${fileId}/move`, {
        method: "PATCH",
        body: JSON.stringify({
          newFolderId,
        }),
      });

      setMoveOpen(false);
      onChanged();
    } catch (err: any) {
      setError(err?.message || "Failed to move file");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveDialogChange = (open: boolean) => {
    setMoveOpen(open);

    if (open) {
      setError(null);
      loadRootFolders();
    } else {
      setError(null);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Dialog open={moveOpen} onOpenChange={handleMoveDialogChange}>
        <DialogTrigger render={
          <Button
            variant="ghost"
            size="sm"
            disabled={loading}
            className="h-8 px-3 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-white" />
        }>
          Move
        </DialogTrigger>

        <DialogContent className=" border-zinc-800 bg-black text-white sm:max-w-md " >
          <DialogHeader>
            <DialogTitle className="text-base">
              Move file
            </DialogTitle>

            <p className="text-sm text-zinc-600">
              Choose a folder where you want to move this file.
            </p>
          </DialogHeader>

          <div className="mt-2 space-y-1">
            <button
              type="button"
              onClick={() => handleMove(null)}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-3 text-left text-sm text-zinc-300 transition-colors hover:border-zinc-800 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 " >
              <span className=" flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 " >
                <svg className="h-4 w-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h6l2 2h10v10H3z" />
                </svg>
              </span>

              <span>Root</span>
            </button>

            {folders.filter((folder) => folder.id !== currentFolderId)
              .map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => handleMove(folder.id)}
                  disabled={loading}
                  className=" flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-3 text-left text-sm text-zinc-300 transition-colors hover:border-zinc-800 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 " >
                  <span className=" flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 " >
                    <svg className="h-4 w-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h6l2 2h10v10H3z" />
                    </svg>
                  </span>

                  <span className="truncate">
                    {folder.name}
                  </span>
                </button>
              ))}

            {folders.filter(
              (folder) => folder.id !== currentFolderId
            ).length === 0 && (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm text-zinc-600">
                    No other folders available.
                  </p>
                </div>
              )}

            {error && (
              <div className=" mt-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 " >
                <p className="text-xs text-zinc-500">
                  {error}
                </p>
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setError(null);
          }
        }}
      >
        <AlertDialogTrigger render={<Button variant="ghost" size="sm" disabled={loading} className=" h-8 px-3 text-xs text-zinc-600 hover:bg-zinc-900 hover:text-white " />}>
          Delete
        </AlertDialogTrigger>

        <AlertDialogContent className=" border-zinc-800 bg-black text-white " >
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this file?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-zinc-500">
              This will permanently delete the file and
              revoke any active share links associated with it.
              This action cannot be undone.
            </AlertDialogDescription>

          </AlertDialogHeader>

          {error && (
            <div className=" rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 " >
              <p className="text-xs text-zinc-500">
                {error}
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading} className=" border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white " >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction onClick={handleDelete} disabled={loading} className=" bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 " >
              {loading ? "Deleting..." : "Delete file"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}