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

export default function RegisterPage() {
  useDocumentTitle("Register");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Registration failed"
        );
      }

      // No login here.
      // User must verify their email first.
      setSubmitted(true);
    } catch (err: any) {
      setError(
        err?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
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

  if (submitted) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
          <div className="w-full">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950">
                <span className="text-sm font-semibold">
                  C
                </span>
              </div>

              <span className="text-sm font-semibold tracking-tight">
                CloudShary
              </span>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl shadow-black/40">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
                </svg>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight">
                Check your email
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                We sent a verification link to{" "}
                <span className="font-medium text-zinc-200">
                  {email}
                </span>
                .
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Click the verification link, then come
                back and log in.
              </p>

              <Button type="button" onClick={() => router.push("/login")} className=" mt-6 h-10 w-full bg-white text-black hover:bg-zinc-200 " >
                Go to login
              </Button>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-600">
              Didn't receive the email? Check your spam
              or junk folder.
            </p>
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
              Create an account
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Start managing and sharing your files.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/40 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5" >
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-zinc-300" >
                  Name
                </Label>

                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  className=" h-10 border-zinc-800 bg-black text-white placeholder:text-zinc-700 focus:border-zinc-500 focus:ring-0 "
                />
              </div>
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
                <Label htmlFor="password" className="text-sm text-zinc-300" >
                  Password
                </Label>

                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  className=" h-10 border-zinc-800 bg-black text-white placeholder:text-zinc-700 focus:border-zinc-500 focus:ring-0 "
                />

                <p className="text-xs text-zinc-600">
                  Password must be at least 8 characters.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5">
                  <p className="text-sm text-zinc-300">
                    {error}
                  </p>
                </div>
              )}

              <Button type="submit" disabled={loading} className=" h-10 w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50 " >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-black" />
                    Creating account...
                  </span>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
            <div className="mt-6 border-t border-zinc-800 pt-6 text-center">
              <p className="text-sm text-zinc-500">
                Already have an account?
              </p>

              <Link href="/login" className=" mt-1 inline-block text-sm font-medium text-white underline underline-offset-4 transition-colors hover:text-zinc-300 " >
                Log in
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