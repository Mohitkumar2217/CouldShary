"use client";

import { useEffect, useState } from "react";
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
  const { login, user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setUnverified(false);
    setResendMessage(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");

        if (data.unverified) {
          setUnverified(true);
        }

        return;
      }

      login(data.accessToken, data.user);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResendMessage(null);

      const res = await fetch(
        `${API_BASE}/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await res.json();

      setResendMessage(
        data.message || "Verification email sent."
      );
    } catch (err: any) {
      setResendMessage(
        err?.message || "Failed to resend verification email."
      );
    }
  };
  if (authLoading || user) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-md px-6 py-20">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
              <p className="text-sm text-zinc-400">
                Loading...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <div className="w-full">
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950">
                <span className="text-sm font-semibold">
                  C
                </span>
              </div>

              <span className="text-sm font-semibold tracking-tight">
                CloudShary
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Log in
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Access your files and workspace.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/40 sm:p-8">
            <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-sm font-medium text-zinc-200">
                Just want to look around?
              </p>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Use the demo account to explore CloudShary.
              </p>

              <button
                type="button"
                onClick={() => {
                  setEmail("systemfirst307@gmail.com");
                  setPassword("Deamon@123");
                }}
                className=" mt-3 text-xs text-zinc-400 underline underline-offset-4 transition-colors hover:text-white "
              >
                Autofill demo credentials
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5" >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-zinc-300" >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className=" h-10 border-zinc-800 bg-black text-white placeholder:text-zinc-700 focus:border-zinc-500 focus:ring-0 "
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm text-zinc-300" >
                    Password
                  </Label>

                  <Link href="/forgot-password" className=" text-xs text-zinc-500 transition-colors hover:text-white " >
                    Forgot password?
                  </Link>
                </div>

                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className=" h-10 border-zinc-800 bg-black text-white placeholder:text-zinc-700 focus:border-zinc-500 focus:ring-0 "
                />
              </div>
              {error && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5">
                  <p className="text-sm text-zinc-300">
                    {error}
                  </p>
                </div>
              )}
              {unverified && (
                <button type="button" onClick={handleResend} className=" text-sm text-zinc-300 underline underline-offset-4 transition-colors hover:text-white " >
                  Resend verification email
                </button>
              )}
              {resendMessage && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5">
                  <p className="text-sm text-zinc-400">
                    {resendMessage}
                  </p>
                </div>
              )}

              <Button type="submit" disabled={loading} className=" h-10 w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50 " >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-black" />
                    Logging in...
                  </span>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>
            <div className="mt-6 border-t border-zinc-800 pt-6 text-center">
              <p className="text-sm text-zinc-500">
                Don't have an account?
              </p>

              <Link href="/register" className=" mt-1 inline-block text-sm font-medium text-white underline underline-offset-4 transition-colors hover:text-zinc-300 " >
                Create account
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-zinc-600">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className=" text-zinc-400 underline underline-offset-4 hover:text-white " >
              Terms of Service
            </Link>
            {" "}and{" "}
            <Link href="/privacy" className=" text-zinc-400 underline underline-offset-4 hover:text-white " >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}