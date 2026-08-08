"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { API_BASE } from "@/lib/config";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { AppHeader } from "@/components/AppHeader";

export default function SettingsPage() {
  useDocumentTitle("Settings");

  const { user, logout } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);
  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");

      const res = await fetch(`${API_BASE}/auth/account`, {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to delete account"
        );
      }

      logout();

      router.push("/");
    } catch (err: any) {
      setError(
        err?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-black text-white">
        <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              Account Settings
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Manage your account and security preferences.
            </p>
          </div>

          <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h2 className="text-sm font-medium text-zinc-200">
                Account
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                Your account information.
              </p>
            </div>

            <div className="px-5 py-5">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-600">
                  Email address
                </span>

                <span className="text-sm text-zinc-300">
                  {user.email}
                </span>
              </div>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.7" >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 3.7 2.8 17a2 2 0 0 0 1.75 3h14.9a2 2 0 0 0 1.75-3l-7.5-13.3a2 2 0 0 0-3.4 0Z" />
                  </svg>
                </div>
                <div>

                  <h2 className="text-sm font-medium text-zinc-200">
                    Danger Zone
                  </h2>

                  <p className="mt-1 text-xs text-zinc-600">
                    Permanently delete your account.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                  <h3 className="text-sm font-medium text-zinc-300">
                    Delete account
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-zinc-600">
                    Deleting your account will remove access to
                    your files, folders, and share links. This
                    action cannot be undone.
                  </p>

                </div>

                <AlertDialog>
                  <AlertDialogTrigger render={
                    <Button variant="outline" className=" shrink-0 border-zinc-700 bg-transparent text-zinc-300 hover:border-white hover:bg-white hover:text-black " />}>
                    Delete Account
                  </AlertDialogTrigger>

                  <AlertDialogContent className=" border-zinc-800 bg-zinc-950 text-white " >
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-zinc-100">
                        Delete your account?
                      </AlertDialogTitle>

                      <AlertDialogDescription className="text-zinc-500">
                        This will permanently remove access
                        to your files, folders, and share links.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-2 py-2">
                      <Label htmlFor="confirm-password" className="text-sm text-zinc-300" >
                        Enter your password
                      </Label>

                      <Input
                        id="confirm-password"
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }}
                        placeholder="Your password"
                        className=" border-zinc-800 bg-black text-white placeholder:text-zinc-600 focus-visible:border-white focus-visible:ring-0 "
                      />

                      {error && (
                        <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
                          <p className="text-xs text-zinc-400">
                            {error}
                          </p>

                        </div>
                      )}
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => {
                          setPassword("");
                          setError(null);
                        }}
                        className=" border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white "
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={
                          loading || !password
                        }
                        className=" bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 "
                      >
                        {loading ? "Deleting..." : "Delete my account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </section>
          <p className="mt-6 text-center text-xs text-zinc-700">
            Account actions are protected by authentication.
          </p>
        </main>
      </div>
    </>
  );
}