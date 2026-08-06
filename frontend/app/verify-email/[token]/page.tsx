"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:7000/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMessage(data.message);
        setStatus("success");
      })
      .catch((err) => {
        setMessage(err.message);
        setStatus("error");
      });
  }, [token]);

  return (
    <div className="max-w-sm mx-auto mt-24 p-6 border rounded-lg text-center">
      {status === "loading" && <p>Verifying...</p>}
      {status === "success" && (
        <>
          <p className="text-sm mb-4">{message}</p>
          <Link href="/login" className="text-sm underline">Go to login</Link>
        </>
      )}
      {status === "error" && <p className="text-sm text-destructive">{message}</p>}
    </div>
  );
}