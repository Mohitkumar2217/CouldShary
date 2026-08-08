"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { apiFetch } from "@/lib/api";
import { FileDropzone } from "@/components/FileDropzone";
import { ShareModal } from "@/components/ShareModal";
import { FileRowActions } from "@/components/FileRowActions";
import { CreateFolderDialog } from "@/components/CreateFolderDialog";
import { FilePreviewDialog } from "@/components/FilePreviewDialog";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import Loading from "../loading";

interface FolderItem {
  id: string;
  name: string;
}

interface FileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
}

export default function DashboardContent() {
  useDocumentTitle("Dashboard");
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFolderId = searchParams.get("folder");
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id: string; name: string }[]
  >([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverFolderId, setDragOverFolderId] =
    useState<string | null>(null);
  const [dragOverRoot, setDragOverRoot] =
    useState(false);
  const [previewFile, setPreviewFile] =
    useState<FileItem | null>(null);
 
  const loadContents = useCallback(
    async (folderId: string | null) => {
      try {
        setLoading(true);
        const query = folderId
          ? `?folderId=${folderId}`
          : "";

        const data = await apiFetch(`/folders${query}`);
        setFolders(data.folders ?? []);
        setFiles(data.files ?? []);

        if (folderId) {
          const bc = await apiFetch(`/folders/${folderId}/breadcrumbs`);
          setBreadcrumbs(bc.breadcrumbs ?? []);
        } else {
          setBreadcrumbs([]);
        }
      } catch (err: any) {
        toast.error(
          err?.message || "Failed to load files"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );
  
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }
    loadContents(currentFolderId);
  }, [
    isLoading,
    user,
    currentFolderId,
    loadContents,
    router,
  ]);
 
  const navigateToFolder = (
    folderId: string | null
  ) => {
    router.push(
      folderId
        ? `/dashboard?folder=${folderId}`
        : "/dashboard"
    );
  };
 
  const handleFileDragStart = (
    e: React.DragEvent,
    fileId: string
  ) => {
    e.dataTransfer.setData(
      "text/plain",
      fileId
    );

    e.dataTransfer.effectAllowed = "move";
  };
 
  const moveFile = async (
    fileId: string,
    newFolderId: string | null
  ) => {
    try {
      await apiFetch(`/folders/files/${fileId}/move`,
        {
          method: "PATCH",
          body: JSON.stringify({
            newFolderId,
          }),
        }
      );

      toast.success("File moved");

      await loadContents(currentFolderId);
    } catch (err: any) {
      toast.error(
        err?.message || "Failed to move file"
      );
    }
  };
 
  const handleFolderDrop = (
    e: React.DragEvent,
    folderId: string
  ) => {
    e.preventDefault();

    setDragOverFolderId(null);

    const fileId =
      e.dataTransfer.getData("text/plain");

    if (fileId) {
      moveFile(fileId, folderId);
    }
  };
 
  const handleRootDrop = (
    e: React.DragEvent
  ) => {
    e.preventDefault();
    setDragOverRoot(false);
    const fileId =
      e.dataTransfer.getData("text/plain");

    if (fileId) {
      moveFile(fileId, null);
    }
  };
 
  if (isLoading) {
    return (
       <Loading />
    );
  }

  if (!user) {
    return null;
  } 
  return (
    <div className="min-h-screen bg-black text-white"> 
      <AppHeader /> 
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"> 
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              My Files
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Manage your files and folders.
            </p>
          </div>
          <CreateFolderDialog parentFolderId={currentFolderId} onCreated={() =>loadContents(currentFolderId)} />
        </div> 
        <div className="mb-5 flex items-center gap-1.5 overflow-x-auto text-sm">
          <button
            onClick={() =>
              navigateToFolder(null)
            }
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverRoot(true);
            }}
            onDragLeave={() =>
              setDragOverRoot(false)
            }
            onDrop={handleRootDrop}
            className={` shrink-0 rounded-md px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white ${ dragOverRoot ? "bg-zinc-900 text-white ring-1 ring-zinc-600" : "" } `}
          >
            Root
          </button>
          {breadcrumbs.map((b) => (
            <div key={b.id} className="flex shrink-0 items-center gap-1.5" >
              <span className="text-zinc-700">/</span>
              <button
                onClick={() =>
                  navigateToFolder(b.id)
                }
                className=" rounded-md px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white "
              >
                {b.name}
              </button>
            </div>
          ))}
        </div> 
        <div className="mb-8">
          <FileDropzone folderId={currentFolderId ?? undefined} onUploadComplete={() =>loadContents(currentFolderId)} />
        </div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-200">
              Files & folders
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              {folders.length} folders ·{" "}
              {files.length} files
            </p>
          </div>
        </div> 
        {loading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-10">
            <div className="flex items-center justify-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
              <p className="text-sm text-zinc-500">
                Loading files...
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">

            {(folders.length > 0 ||
              files.length > 0) && (
              <div className=" hidden border-b border-zinc-800 px-4 py-2.5 text-xs font-medium text-zinc-600 sm:grid sm:grid-cols-[1fr_120px] " >
                <span>Name</span>
                <span className="text-right">
                  Actions
                </span>
              </div>
            )} 
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() =>
                  navigateToFolder(folder.id)
                }
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverFolderId(
                    folder.id
                  );
                }}
                onDragLeave={() =>
                  setDragOverFolderId(null)
                }
                onDrop={(e) =>
                  handleFolderDrop(
                    e,
                    folder.id
                  )
                }
                className={`group flex cursor-pointer items-center justify-between border-b border-zinc-800 px-4 py-3.5 transition-colors hover:bg-zinc-900/70 ${  dragOverFolderId === folder.id  ? "bg-zinc-900 ring-1 ring-inset ring-zinc-600"  : "" } `}
              >
                <div className="flex min-w-0 items-center gap-3"> 
                  <div className=" flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 " >
                    <svg className="h-4 w-4 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v7A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5v-9Z" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {folder.name}
                    </p>
                    <p className="text-xs text-zinc-600">
                      Folder
                    </p>
                  </div>
                </div>
                <div className="hidden text-xs text-zinc-700 sm:block">
                  Open →
                </div>
              </div>
            ))}
            {files.map((file) => (
              <div
                key={file.id}
                draggable
                onDragStart={(e) =>
                  handleFileDragStart(
                    e,
                    file.id
                  )
                }
                className=" group flex cursor-grab items-center justify-between border-b border-zinc-800 px-4 py-3.5 transition-colors hover:bg-zinc-900/70 active:cursor-grabbing "
              >
                <div className=" flex min-w-0 cursor-pointer items-center gap-3 "
                  onClick={() =>
                    setPreviewFile(file)
                  }
                > 
                  <div className=" flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 " >
                    <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h8l4 4v14H6V3Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200 transition-colors group-hover:text-white">
                      {file.name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-600">
                      {(
                        file.size / 1024
                      ).toFixed(1)}{" "}
                      KB
                    </p>
                  </div>
                </div>
                <div className=" ml-4 flex shrink-0 items-center gap-1 " onClick={(e) => e.stopPropagation() }>
                  <ShareModal fileId={file.id} fileName={file.name} />
                  <FileRowActions
                    fileId={file.id}
                    currentFolderId={
                      currentFolderId
                    }
                    onChanged={() =>
                      loadContents(
                        currentFolderId
                      )
                    }
                  />
                </div>
              </div>
            ))} 
            {folders.length === 0 &&
              files.length === 0 && (
                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                  <div className=" mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 " >
                    <svg className="h-5 w-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6.5A1.5 1.5 0 0 1 5.5 5h4l2 2h7A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11Z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-300">
                    This folder is empty
                  </h3>

                  <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-600">
                    Upload a file or create a folder
                    to get started.
                  </p>
                </div>
              )}
          </div>
        )}

        {previewFile && (
          <FilePreviewDialog
            fileId={previewFile.id}
            fileName={previewFile.name}
            mimeType={previewFile.mimeType}
            open={!!previewFile}
            onOpenChange={(open) => {
              if (!open) {
                setPreviewFile(null);
              }
            }}
          />
        )}
      </main>
    </div>
  );
}
  