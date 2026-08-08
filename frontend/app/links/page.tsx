"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { apiFetch } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareLinkItem {
  id: string;
  token: string;
  fileName: string;
  visibility: string;
  status:
  | "active"
  | "revoked"
  | "expired"
  | "limit_reached";
  expiresAt: string | null;
  maxDownloads: number | null;
  downloadCount: number;
  createdAt: string;
  url: string;
}

const statusColors: Record<string, string> = {
  active: "text-white",
  revoked: "text-zinc-500",
  expired: "text-zinc-400",
  limit_reached: "text-zinc-400",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  revoked: "Revoked",
  expired: "Expired",
  limit_reached: "Limit reached",
};

export default function MyLinksPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [links, setLinks] = useState<ShareLinkItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadLinks = async (p: number) => {
    try {
      setLoading(true);

      const data = await apiFetch(
        `/share-links?page=${p}&limit=10`
      );

      setLinks(data.links ?? []);

      setTotalPages(
        data.pagination?.totalPages ?? 1
      );
    } catch (err: any) {
      toast.error(
        err?.message || "Failed to load share links"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    loadLinks(page);
  }, [user, isLoading, page, router]);

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);

      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const revoke = async (id: string) => {
    try {
      await apiFetch(`/share/${id}`, {
        method: "DELETE",
      });

      toast.success("Link revoked");
      await loadLinks(page);
    } catch (err: any) {
      toast.error(
        err?.message || "Failed to revoke link"
      );
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8">
            <div className="flex items-center justify-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
              <p className="text-sm text-zinc-500">
                Loading...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  return (
    <div className="min-h-screen bg-black text-white">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            My Share Links
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage the links you have created for your files.
          </p>
        </div>
        {loading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-10">
            <div className="flex items-center justify-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
              <p className="text-sm text-zinc-500">
                Loading share links...
              </p>
            </div>
          </div>
        ) : links.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-20 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
              <svg className="h-5 w-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 7 20l1.15-1.15" />
              </svg>
            </div>

            <h2 className="text-sm font-medium text-zinc-300">
              No share links
            </h2>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-zinc-600">
              Share a file from your dashboard and
              your generated links will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
            <div className="hidden border-b border-zinc-800 px-5 py-3 text-xs font-medium text-zinc-600 md:grid md:grid-cols-[1fr_150px_150px_150px]">
              <span>
                File
              </span>
              <span>
                Status
              </span>
              <span>
                Details
              </span>
              <span className="text-right">
                Actions
              </span>
            </div>
            {links.map((link) => (
              <div key={link.id} className=" border-b border-zinc-800 px-5 py-4 last:border-b-0 hover:bg-zinc-900/50 transition-colors " >
                <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_150px_150px_150px] md:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                      <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h8l4 4v14H6V3Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {link.fileName}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-zinc-600">
                        {link.visibility}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className={` inline-flex items-center gap-1.5 text-xs font-medium ${statusColors[link.status]} `}>
                      <span className={`h-1.5w-1.5rounded-full${link.status === "active" ? "bg-white" : "bg-zinc-600"}`} />
                      {statusLabels[link.status]}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    {link.expiresAt && (
                      <p>
                        Expires{" "}
                        {new Date(
                          link.expiresAt
                        ).toLocaleDateString()}
                      </p>
                    )}

                    {link.maxDownloads !== null ? (
                      <p>
                        {link.downloadCount}/
                        {link.maxDownloads} downloads
                      </p>
                    ) : (
                      <p>
                        {link.downloadCount} downloads
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-start gap-2 md:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyLink(link.url)
                      }
                      className=" border-zinc-700 bg-transparent text-zinc-300 hover:bg-white hover:text-black hover:border-white "
                    >
                      <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" >
                        <rect width="13" height="13" x="8" y="8" rx="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                      </svg>
                      Copy
                    </Button>
                    {link.status === "active" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          revoke(link.id)
                        }
                        className=" text-zinc-500 hover:bg-zinc-900 hover:text-white "
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() =>
                setPage((p) => p - 1)
              }
              className=" border-zinc-800 bg-black text-zinc-400 hover:bg-zinc-900 hover:text-white "
            >
              Previous
            </Button>
            <span className="min-w-24 text-center text-xs text-zinc-600">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((p) => p + 1)
              }
              className=" border-zinc-800 bg-black text-zinc-400 hover:bg-zinc-900 hover:text-white " >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}