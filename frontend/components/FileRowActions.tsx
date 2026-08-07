"use client";

import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

interface FolderOption { id: string; name: string; }

export function FileRowActions({
  fileId,
  currentFolderId,
  onChanged,
}: {
  fileId: string;
  currentFolderId: string | null;
  onChanged: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/files/${fileId}`, { method: "DELETE" });
      setDeleteOpen(false);
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRootFolders = async () => { 
    const data = await apiFetch(`/folders`);
    setFolders(data.folders);
  };

  const handleMove = async (newFolderId: string | null) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/folders/files/${fileId}/move`, {
        method: "PATCH",
        body: JSON.stringify({ newFolderId }),
      });
      setMoveOpen(false);
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Dialog open={moveOpen} onOpenChange={(open) => { setMoveOpen(open); if (open) loadRootFolders(); }}>
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>
          Move
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move file</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <button
              onClick={() => handleMove(null)}
              disabled={loading}
              className="w-full text-left p-2 rounded hover:bg-accent text-sm"
            >
              📁 Root
            </button>
            {folders
              .filter((f) => f.id !== currentFolderId)
              .map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleMove(f.id)}
                  disabled={loading}
                  className="w-full text-left p-2 rounded hover:bg-accent text-sm"
                >
                  📁 {f.name}
                </button>
              ))}
          </div>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="text-destructive" />}>
          Delete
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also revoke any active share links for this file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}