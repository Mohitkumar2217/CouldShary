"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (user) return null; // avoid flashing the landing page before the redirect fires

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-semibold mb-3">Secure File Sharing</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Upload, organize, and share files privately or publicly — with password protection
        and expiring links when you need them.
      </p>
      <div className="flex gap-3">
        <Link href="/login">
          <Button>Log in</Button>
        </Link>
        <Link href="/register">
          <Button variant="outline">Create account</Button>
        </Link>
      </div>
    </div>
  );
}