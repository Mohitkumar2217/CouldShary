"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE } from "@/lib/config";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function ResetPasswordPage() {
  useDocumentTitle("Reset Password");

  const { token } = useParams();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            newPassword: password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Password reset failed"
        );
      }

      router.push("/login");
    } catch (err: any) {
      setError(
        err?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div rounded-xl className=" border border-zinc-800 bg-zinc-950 p-6 shadow-2xl " >
            <div className="mb-6">
              <h1 className="text-xl font-semibold tracking-tight">
                Set a new password
              </h1>

              <p className="mt-2 text-sm leading-5 text-zinc-500">
                Choose a strong password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" >
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-zinc-300" >
                  New password
                </Label>

                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter new password"
                  required
                  minLength={8}
                  className=" border-zinc-800 bg-black text-white placeholder:text-zinc-600 focus-visible:border-white focus-visible:ring-0 "
                />

                <p className="text-xs text-zinc-600">
                  Password must contain at least 8 characters.
                </p>

              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm text-zinc-300" >
                  Confirm password
                </Label>

                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                  className=" border-zinc-800 bg-black text-white placeholder:text-zinc-600 focus-visible:border-white focus-visible:ring-0 "
                />
              </div>

              {error && (
                <div className=" rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 " >
                  <p className="text-sm text-zinc-300">
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className=" w-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 "
              >
                {loading
                  ? "Updating..."
                  : "Update password"}
              </Button>
            </form>

            <div className=" mt-6 border-t border-zinc-800 pt-5">
              <p className="text-xs leading-5 text-zinc-600">
                After updating your password, you'll be
                redirected to the login page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}