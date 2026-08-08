"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE } from "@/lib/config";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function LoginPage() {
  useDocumentTitle("Log in");
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnverified(false);
    setResendMessage(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        if (data.unverified) setUnverified(true);
        return;
      }
      login(data.accessToken, data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMessage(null);
    const res = await fetch(`${API_BASE}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setResendMessage(data.message);
  };

  return (
    <div className="max-w-sm mx-auto mt-24 p-6 border rounded-lg">
      <h1 className="text-xl font-semibold mb-6">Log in</h1>
      <div className="mb-4 p-3 bg-muted rounded-md text-sm">
        <p className="text-muted-foreground mb-1">Just want to look around?</p>
        <p className="font-mono text-xs">systemfirst307@gamil.com / Deamon@123</p>
        <button
          type="button"
          onClick={() => { setEmail("systemfirst307@gmail.com"); setPassword("Deamon@123"); }}
          className="text-xs underline mt-1"
        >
          Autofill demo credentials
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {unverified && (
          <button type="button" onClick={handleResend} className="text-sm underline text-muted-foreground">
            Resend verification email
          </button>
        )}
        {resendMessage && <p className="text-sm text-muted-foreground">{resendMessage}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>
      <div className="flex justify-between mt-4 text-sm">
        <Link href="/register" className="text-muted-foreground hover:underline">Create account</Link>
        <Link href="/forgot-password" className="text-muted-foreground hover:underline">Forgot password?</Link>
      </div>
    </div>
  );
}