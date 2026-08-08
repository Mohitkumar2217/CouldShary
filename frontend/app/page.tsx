"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { GithubStarButton } from "@/components/GithubStarButton";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Prevent landing-page flash for authenticated users
  if (user) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute right-6 top-6">
        <GithubStarButton />
      </div>
      <main className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <div className=" flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 " >
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m7 10 5 5 5-5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14" />
              </svg>
            </div>
          </div>
          <h1 className=" text-4xl font-semibold tracking-tight sm:text-5xl " >
            Secure file sharing,
            <br />
            <span className="text-zinc-500">
              without the complexity.
            </span>
          </h1>
          <p className=" mx-auto mt-5 max-w-xl text-sm leading-6 text-zinc-500 sm:text-base " >
            Upload, organize, and share your files privately
            or publicly. Create protected links with
            expiration dates and download limits.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button className=" h-10 w-full bg-white px-6 text-black hover:bg-zinc-200 sm:w-auto " >
                Get started
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className=" h-10 w-full border-zinc-800 bg-transparent px-6 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900 hover:text-white sm:w-auto " >
                Log in
              </Button>
            </Link>
          </div>

          <div className=" mx-auto mt-14 grid max-w-lg grid-cols-1 divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 sm:grid-cols-3 sm:divide-x sm:divide-y-0 " >
            <div className="px-5 py-5">
              <div className="mb-2 text-sm font-medium">
                Private
              </div>
              <p className="text-xs leading-5 text-zinc-600">
                Keep your files under your control.
              </p>
            </div>

            <div className="px-5 py-5">
              <div className="mb-2 text-sm font-medium">
                Protected
              </div>
              <p className="text-xs leading-5 text-zinc-600">
                Secure links with access controls.
              </p>
            </div>

            <div className="px-5 py-5">
              <div className="mb-2 text-sm font-medium">
                Simple
              </div>
              <p className="text-xs leading-5 text-zinc-600">
                Upload, organize, and share easily.
              </p>
            </div>
          </div>

          <p className="mt-8 text-xs text-zinc-700">
            CloudShary · Secure file sharing
          </p>
        </div>
      </main>
    </div>
  );
}