"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE } from "@/lib/config";

interface ShareMeta {
  file: {
    name: string;
    size: number;
    mimeType?: string;
  };
  requiresPassword: boolean;
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [meta, setMeta] = useState<ShareMeta | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!token) return;
    const loadShare = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/share/${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error || "Unable to load shared file"
          );
        }

        setMeta(data);
      } catch (err: any) {
        setError(err.message || "Unable to load shared file");
      } finally {
        setLoading(false);
      }
    };

    loadShare();
  }, [token]);

  const handleDownload = async () => {
    setError(null);
    setDownloading(true);

    try {
      const res = await fetch(
        `${API_BASE}/share/${token}/download`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Download failed"
        );
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-zinc-950 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
          <p className="text-sm text-zinc-500">
            Loading shared file...
          </p>
        </div>
      </main>
    );
  }
  if (error && !meta) {
    return (
      <main className="min-h-screen bg-white text-zinc-950 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
              <svg className="h-5 w-5 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16h.01" />
                <path d="M10.3 4.8 2.7 18a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>

            <h1 className="text-lg font-semibold tracking-tight">
              Unable to access file
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!meta) {
    return null;
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m7 10 5 5 5-5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14" />
              </svg>
            </div>

            <p className="text-sm font-semibold tracking-tight">
              CloudShary
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">

            <div className="border-b border-zinc-200 px-6 py-5">
              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
                  <svg className="h-5 w-5 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
                  </svg>
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-base font-semibold">
                    {meta.file.name}
                  </h1>

                  <p className="mt-1 text-xs text-zinc-500">
                    {(meta.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">

              {meta.requiresPassword ? (
                <div className="mb-5">
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium"
                  >
                    Password required
                  </label>

                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleDownload();
                      }
                    }}
                    className="border-zinc-200 focus-visible:ring-zinc-950"
                  />

                  <p className="mt-2 text-xs text-zinc-500">
                    This file is protected by a password.
                  </p>
                </div>
              ) : (
                <p className="mb-5 text-sm text-zinc-500">
                  This file has been shared with you.
                </p>
              )}

              {error && (
                <div className="mb-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                  <p className="text-sm text-zinc-800">
                    {error}
                  </p>
                </div>
              )}

              <Button
                onClick={handleDownload}
                disabled={
                  downloading ||
                  (meta.requiresPassword && !password)
                }
                className=" h-10 w-full bg-zinc-950 text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-500 "
              >
                {downloading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
                    Downloading...
                  </span>
                ) : (
                  "Download file"
                )}
              </Button>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-zinc-400">
            Secure file sharing by CloudShary
          </p>
        </div>
      </div>
    </main>
  );
}