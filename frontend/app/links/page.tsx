"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { apiFetch } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareLinkItem {
  id: string; token: string; fileName: string; visibility: string;
  status: "active" | "revoked" | "expired" | "limit_reached";
  expiresAt: string | null; maxDownloads: number | null; downloadCount: number;
  createdAt: string; url: string;
}

const statusColors: Record<string, string> = {
  active: "text-green-600",
  revoked: "text-muted-foreground",
  expired: "text-orange-600",
  limit_reached: "text-orange-600",
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
    setLoading(true);
    const data = await apiFetch(`/share-links?page=${p}&limit=10`);
    setLinks(data.links);
    setTotalPages(data.pagination.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push("/login"); return; }
    loadLinks(page);
  }, [user, isLoading, page, router]);

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const revoke = async (id: string) => {
    try {
      await apiFetch(`/share/${id}`, { method: "DELETE" });
      toast.success("Link revoked");
      loadLinks(page);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading || !user) return null;

  return (
    <>
      <AppHeader />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-6">My Share Links</h1>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : links.length === 0 ? (
          <p className="text-sm text-muted-foreground">No share links yet.</p>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <div key={link.id} className="flex justify-between items-center p-3 border rounded-md">
                <div>
                  <p className="text-sm font-medium">{link.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {link.visibility} · <span className={statusColors[link.status]}>{statusLabels[link.status]}</span>
                    {link.expiresAt && ` · expires ${new Date(link.expiresAt).toLocaleDateString()}`}
                    {link.maxDownloads && ` · ${link.downloadCount}/${link.maxDownloads} downloads`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyLink(link.url)}>Copy</Button>
                  {link.status === "active" && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => revoke(link.id)}>
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground self-center">
              Page {page} of {totalPages}
            </span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
}