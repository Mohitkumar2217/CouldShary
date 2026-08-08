"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch } from "@/lib/api";

export function ShareModal({
    fileId,
    fileName,
}: {
    fileId: string;
    fileName: string;
}) {
    const [open, setOpen] = useState(false);
    const [usePassword, setUsePassword] = useState(false);
    const [password, setPassword] = useState("");
    const [useExpiry, setUseExpiry] = useState(false);
    const [expiresAt, setExpiresAt] = useState("");
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await apiFetch(`/files/${fileId}/share`, {
                method: "POST",
                body: JSON.stringify({
                    visibility: "PUBLIC",
                    password: usePassword ? password : undefined,
                    expiresAt: useExpiry
                        ? new Date(expiresAt).toISOString()
                        : undefined,
                }),
            });

            setShareUrl(data.shareLink.url);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
        }
    };

    const handleClose = (value: boolean) => {
        setOpen(value);

        if (!value) {
            setError(null);
            setShareUrl(null);
            setPassword("");
            setExpiresAt("");
            setUsePassword(false);
            setUseExpiry(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger render={<Button variant="outline" size="sm" className=" border-black bg-white text-black hover:bg-black hover:text-white transition-colors " />}>
                Share
            </DialogTrigger>

            <DialogContent className="border-black bg-white text-black sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-black">
                        Share "{fileName}"
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="link" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 border border-black bg-white">
                        <TabsTrigger value="link" className=" data-[state=active]:bg-black data-[state=active]:text-white text-black " >
                            Share Link
                        </TabsTrigger>
                        <TabsTrigger value="people" className=" data-[state=active]:bg-black data-[state=active]:text-white text-black " >
                            Specific People
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="link" className="pt-5">
                        {!shareUrl ? (
                            <div className="space-y-5">

                                <div className="rounded-lg border border-black/15 p-4">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id={`use-password-${fileId}`}
                                            checked={usePassword}
                                            onCheckedChange={(value) =>
                                                setUsePassword(!!value)
                                            }
                                            className="border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
                                        />

                                        <Label
                                            htmlFor={`use-password-${fileId}`}
                                            className="cursor-pointer font-medium text-black"
                                        >
                                            Password protect
                                        </Label>
                                    </div>

                                    {usePassword && (
                                        <div className="mt-3">
                                            <Input
                                                type="password"
                                                placeholder="Enter a password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className=" border-black/30 text-black placeholder:text-black/40 focus-visible:ring-black" />
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg border border-black/15 p-4">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id={`use-expiry-${fileId}`}
                                            checked={useExpiry}
                                            onCheckedChange={(value) =>
                                                setUseExpiry(!!value)
                                            }
                                            className="border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
                                        />

                                        <Label
                                            htmlFor={`use-expiry-${fileId}`}
                                            className="cursor-pointer font-medium text-black"
                                        >
                                            Set expiration
                                        </Label>
                                    </div>

                                    {useExpiry && (
                                        <div className="mt-3">
                                            <Input
                                                type="datetime-local"
                                                value={expiresAt}
                                                onChange={(e) =>
                                                    setExpiresAt(e.target.value)
                                                }
                                                className=" border-black/30 text-black focus-visible:ring-black "
                                            />
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="rounded-md border border-black bg-black px-3 py-2">
                                        <p className="text-sm text-white">
                                            {error}
                                        </p>
                                    </div>
                                )}

                                <Button
                                    onClick={handleCreate}
                                    disabled={loading || (usePassword && !password) || (useExpiry && !expiresAt)}
                                    className=" w-full bg-black text-white hover:bg-black/80 "
                                >
                                    {loading ? "Creating..." : "Create Share Link"}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-lg border border-black bg-black p-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                                        Share link created
                                    </p>

                                    <p className="mt-1 text-sm text-white">
                                        Anyone with this link can access the file.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Input readOnly value={shareUrl} className=" border-black/30 text-black focus-visible:ring-black " />
                                    <Button onClick={copyLink} className=" bg-black text-white hover:bg-black/80 " >
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="people" className="pt-5">
                        <AccessGrantSection fileId={fileId} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

function AccessGrantSection({ fileId }: { fileId: string }) {
    const [email, setEmail] = useState("");
    const [grants, setGrants] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const loadGrants = async () => {
        try {
            const data = await apiFetch(`/files/${fileId}/access`);
            setGrants(data.grants ?? []);
        } catch (err: any) {
            setError(err.message);
        }
    };

    useEffect(() => {
        loadGrants();
    }, [fileId]);

    const addGrant = async () => {
        if (!email.trim()) return;

        setError(null);
        setLoading(true);

        try {
            await apiFetch(`/files/${fileId}/access`, {
                method: "POST",
                body: JSON.stringify({
                    email: email.trim(),
                    permission: "DOWNLOAD",
                }),
            });

            setEmail("");
            await loadGrants();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const removeGrant = async (userId: string) => {
        try {
            setError(null);

            await apiFetch(`/files/${fileId}/access/${userId}`, {
                method: "DELETE",
            });

            await loadGrants();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="space-y-5">
            <div>
                <p className="mb-2 text-sm font-medium text-black">
                    Give someone access
                </p>

                <div className="flex gap-2">
                    <Input
                        type="email"
                        placeholder="person@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                addGrant();
                            }
                        }}
                        className=" border-black/30 text-black placeholder:text-black/40 focus-visible:ring-black "
                    />

                    <Button
                        onClick={addGrant}
                        disabled={loading || !email.trim()}
                        className=" bg-black text-white hover:bg-black/80 "
                    >
                        {loading ? "Adding..." : "Add"}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-md border border-black bg-black px-3 py-2">
                    <p className="text-sm text-white">
                        {error}
                    </p>
                </div>
            )}

            <div className="space-y-2">
                {grants.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-black/20 p-5 text-center">
                        <p className="text-sm text-black/50">
                            No people have access to this file yet.
                        </p>
                    </div>
                ) : (
                    grants.map((g) => (
                        <div key={g.user.id} className=" flex items-center justify-between rounded-lg border border-black/15 px-3 py-3 " >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-black">
                                    {g.user.email}
                                </p>

                                <p className="mt-0.5 text-xs uppercase tracking-wide text-black/50">
                                    {g.permission}
                                </p>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeGrant(g.user.id)}
                                className=" text-black hover:bg-black hover:text-white "
                            >
                                Remove
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}