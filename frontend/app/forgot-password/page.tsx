"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE } from "@/lib/config";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await fetch(`${API_BASE}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        setLoading(false);
        setSubmitted(true); // always show success, regardless of whether the email existed
    };

    return (
        <div className="max-w-sm mx-auto mt-24 p-6 border rounded-lg">
            <h1 className="text-xl font-semibold mb-6">Reset your password</h1>
            {submitted ? (
                <p className="text-sm">If that email is registered, a reset link has been sent. Check your inbox.</p>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Sending..." : "Send reset link"}
                    </Button>
                </form>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
                <Link href="/login" className="hover:underline">Back to login</Link>
            </p>
        </div>
    );
}