"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

export default function SharePage() {
  const { token } = useParams();
  const [meta, setMeta] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    apiFetch(`/share/${token}`)
      .then(setMeta)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDownload = async () => {
    setError(null);
    setDownloading(true);
    try {
      const data = await apiFetch(`/share/${token}/download`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message); // now shown inline, not crashed to console
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <p className="p-8">Loading...</p>;
  if (error && !meta) return <p className="p-8 text-destructive">{error}</p>;

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg">
      <h1 className="text-lg font-semibold mb-2">{meta.file.name}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {(meta.file.size / 1024 / 1024).toFixed(2)} MB
      </p>

      {meta.requiresPassword && (
        <Input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3"
        />
      )}

      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      <Button onClick={handleDownload} disabled={downloading} className="w-full">
        {downloading ? "Downloading..." : "Download"}
      </Button>
    </div>
  );
}