"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE } from "@/lib/config";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function ForgotPasswordPage() {
  useDocumentTitle("Forgot Password");

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-6">
              <h1 className="text-xl font-semibold tracking-tight">
                Reset your password
              </h1>

              <p className="mt-2 text-sm leading-5 text-zinc-500">
                Enter your email address and we'll send you a
                password reset link.
              </p>
            </div>

            {submitted ? ( 
              <div className="space-y-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
                    <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-zinc-200">
                    Check your email
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    If that email is registered, a password
                    reset link has been sent. Check your inbox.
                  </p>
                </div>

                <Button type="button" variant="outline" className=" w-full border-zinc-700 bg-transparent text-zinc-300 hover:border-white hover:bg-white hover:text-black "
                  onClick={() => setSubmitted(false)}
                >
                  Try another email
                </Button>

              </div>
            ) : ( 
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
                    placeholder="you@example.com"
                    required
                    className=" border-zinc-800 bg-black text-white placeholder:text-zinc-600 focus-visible:border-white focus-visible:ring-0 "
                  />

                </div>
                <Button type="submit" disabled={loading} className=" w-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 " >
                  {loading
                    ? "Sending..."
                    : "Send reset link"}
                </Button>
              </form>
            )}
 
            <div className="mt-6 border-t border-zinc-800 pt-5">
              <Link href="/login" className=" flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white ">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m12 19-7-7 7-7" />
                </svg>
                Back to login
              </Link>

            </div>

          </div>
 
          <p className="mt-5 text-center text-xs text-zinc-600">
            Your account security is important to us.
          </p>

        </div>
      </div>
    </div>
  );
}