"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch("http://localhost:7000/auth/account", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete account");

            logout();
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-md mx-auto mt-16 p-6">
            <h1 className="text-xl font-semibold mb-6">Account Settings</h1>
            <p className="text-sm text-muted-foreground mb-8">Signed in as {user.email}</p>

            <div className="border border-destructive/30 rounded-lg p-4">
                <h2 className="font-medium text-destructive mb-2">Danger Zone</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    Deleting your account will remove access to all your files and folders. This cannot be undone.
                </p>

                <AlertDialog>
                    <AlertDialogTrigger>
                        <Button variant="destructive">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently affect access to your files, folders, and share links. Enter your password to confirm.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-2">
                            <Label htmlFor="confirm-password">Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={loading || !password}>
                                {loading ? "Deleting..." : "Delete my account"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}