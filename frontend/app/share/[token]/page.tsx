"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_BASE = "http://localhost:7000";

export default function SharePage() {
  const { token } = useParams();
  const [meta, setMeta] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/share/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data;
      })
      .then(setMeta)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDownload = async () => {
    setError(null);
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/share/${token}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error); // "Incorrect password" now shows correctly
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
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