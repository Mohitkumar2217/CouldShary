"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/lib/config";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function VerifyEmailPage() {
  useDocumentTitle("Verify Email");
  const { token } = useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/auth/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error || "Email verification failed"
          );
        }

        setMessage(
          data.message || "Your email has been verified."
        );

        setStatus("success");
      })
      .catch((err) => {
        setMessage(
          err?.message || "Email verification failed"
        );

        setStatus("error");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className=" rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl " >
            {status === "loading" && (
              <div className="flex flex-col items-center text-center">
                <div className=" mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 " >
                  <div className=" h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-white " />
                </div>

                <h1 className="text-xl font-semibold">
                  Verifying your email
                </h1>

                <p className="mt-2 text-sm text-zinc-500">
                  Please wait while we verify your email
                  address.
                </p>

              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center text-center">
                <div className=" mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 " >
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                  </svg>
                </div>

                <h1 className="text-xl font-semibold">
                  Email verified
                </h1>

                <p className="mt-2 text-sm leading-5 text-zinc-500">
                  {message}
                </p>

                <Link href="/login" className="mt-6 w-full" >
                  <Button className=" w-full bg-white text-black hover:bg-zinc-200 " >
                    Go to login
                  </Button>
                </Link>
              </div>
            )}
            {status === "error" && (
              <div className="flex flex-col items-center text-center">
                <div className=" mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 " >
                  <svg className="h-5 w-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18" />
                  </svg>
                </div>

                <h1 className="text-xl font-semibold">
                  Verification failed
                </h1>

                <p className="mt-2 text-sm leading-5 text-zinc-500">
                  {message}
                </p>

                <Link href="/login" className="mt-6 w-full" >
                  <Button variant="outline" className=" w-full border-zinc-700 bg-transparent text-zinc-300 hover:border-white hover:bg-white hover:text-black " >
                    Back to login
                  </Button>
                </Link>

              </div>
            )}
          </div> 
          <p className="mt-5 text-center text-xs text-zinc-700">
            Email verification helps keep your account secure.
          </p>
        </div>
      </div>
    </div>
  );
}