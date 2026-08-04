"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { apiFetch } from "@/lib/api";
import { FileDropzone } from "@/components/FIleDropzone";
import { ShareModal } from "@/components/ShareModal";
import { Button } from "@/components/ui/button";

interface FolderItem { id: string; name: string; }
interface FileItem { id: string; name: string; size: number; mimeType: string; }

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!user) {
      router.push("/login");
      return;
    }
    loadContents(currentFolderId);
  }, [user, currentFolderId, loadContents, router]);

  const createFolder = async () => {
    const name = prompt("Folder name:");
    if (!name) return;
    await apiFetch("/folders", {
      method: "POST",
      body: JSON.stringify({ name, parentFolderId: currentFolderId }),
    });
    loadContents(currentFolderId);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">My Files</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={createFolder}>New Folder</Button>
          <Button variant="ghost" onClick={logout}>Log out</Button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex gap-2 text-sm text-muted-foreground mb-4">
        <button onClick={() => setCurrentFolderId(null)} className="hover:underline">Root</button>
        {breadcrumbs.map((b) => (
          <span key={b.id}>
            {" / "}
            <button onClick={() => setCurrentFolderId(b.id)} className="hover:underline">{b.name}</button>
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
              className="flex justify-between items-center p-3 border rounded-md hover:bg-accent cursor-pointer"
              onClick={() => setCurrentFolderId(folder.id)}
            >
              <span>📁 {folder.name}</span>
            </div>
          ))}
          {files.map((file) => (
            <div key={file.id} className="flex justify-between items-center p-3 border rounded-md">
              <span>📄 {file.name} <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span></span>
              <ShareModal fileId={file.id} fileName={file.name} />
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