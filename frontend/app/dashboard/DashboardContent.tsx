"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { apiFetch } from "@/lib/api";
import { FileDropzone } from "@/components/FileDropzone";
import { ShareModal } from "@/components/ShareModal";
import { FileRowActions } from "@/components/FileRowActions";
import { CreateFolderDialog } from "@/components/CreateFolderDialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FolderItem { id: string; name: string; }
interface FileItem { id: string; name: string; size: number; mimeType: string; }

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFolderId = searchParams.get("folder"); // URL is the source of truth now

  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverRoot, setDragOverRoot] = useState(false);

  const loadContents = useCallback(async (folderId: string | null) => {
    setLoading(true);
    const query = folderId ? `?folderId=${folderId}` : "";
    const data = await apiFetch(`/folders${query}`);
    setFolders(data.folders);
    setFiles(data.files);
    if (folderId) {
      const bc = await apiFetch(`/folders/${folderId}/breadcrumbs`);
      setBreadcrumbs(bc.breadcrumbs);
    } else {
      setBreadcrumbs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadContents(currentFolderId);
  }, [isLoading, user, currentFolderId, loadContents, router]);

  const navigateToFolder = (folderId: string | null) => {
    router.push(folderId ? `/dashboard?folder=${folderId}` : "/dashboard");
  };

  // --- Drag and drop: moving an existing file onto a folder ---
  const handleFileDragStart = (e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData("text/plain", fileId);
    e.dataTransfer.effectAllowed = "move";
  };

  const moveFile = async (fileId: string, newFolderId: string | null) => {
    try {
      await apiFetch(`/folders/files/${fileId}/move`, {
        method: "PATCH",
        body: JSON.stringify({ newFolderId }),
      });
      loadContents(currentFolderId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFolderDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const fileId = e.dataTransfer.getData("text/plain");
    if (fileId) moveFile(fileId, folderId);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverRoot(false);
    const fileId = e.dataTransfer.getData("text/plain");
    if (fileId) moveFile(fileId, null);
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">My Files</h1>
        <div className="flex gap-2">
          <CreateFolderDialog parentFolderId={currentFolderId} onCreated={() => loadContents(currentFolderId)} />
          {user.role === "ADMIN" && (
            <Link href="/admin/users"><Button variant="outline">Admin</Button></Link>
          )}
          <Button variant="ghost" onClick={logout}>Log out</Button>
        </div>
      </div>

      <div className="flex gap-2 text-sm text-muted-foreground mb-4">
        <button
          onClick={() => navigateToFolder(null)}
          onDragOver={(e) => { e.preventDefault(); setDragOverRoot(true); }}
          onDragLeave={() => setDragOverRoot(false)}
          onDrop={handleRootDrop}
          className={`hover:underline px-1 rounded ${dragOverRoot ? "bg-primary/10 ring-1 ring-primary" : ""}`}
        >
          Root
        </button>
        {breadcrumbs.map((b) => (
          <span key={b.id}>
            {" / "}
            <button onClick={() => navigateToFolder(b.id)} className="hover:underline">{b.name}</button>
          </span>
        ))}
      </div>

      <FileDropzone folderId={currentFolderId ?? undefined} onUploadComplete={() => loadContents(currentFolderId)} />

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="mt-6 space-y-2">
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => navigateToFolder(folder.id)}
              onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(folder.id); }}
              onDragLeave={() => setDragOverFolderId(null)}
              onDrop={(e) => handleFolderDrop(e, folder.id)}
              className={`flex justify-between items-center p-3 border rounded-md hover:bg-accent cursor-pointer transition-colors ${dragOverFolderId === folder.id ? "bg-primary/10 ring-2 ring-primary" : ""
                }`}
            >
              <span>📁 {folder.name}</span>
            </div>
          ))}
          {files.map((file) => (
            <div
              key={file.id}
              draggable
              onDragStart={(e) => handleFileDragStart(e, file.id)}
              className="flex justify-between items-center p-3 border rounded-md cursor-grab active:cursor-grabbing"
            >
              <span>📄 {file.name} <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span></span>
              <div className="flex gap-2">
                <ShareModal fileId={file.id} fileName={file.name} />
                <FileRowActions fileId={file.id} currentFolderId={currentFolderId} onChanged={() => loadContents(currentFolderId)} />
              </div>
            </div>
          ))}
          {folders.length === 0 && files.length === 0 && (
            <p className="text-sm text-muted-foreground">This folder is empty.</p>
          )}
        </div>
      )}
    </div>
  );
}