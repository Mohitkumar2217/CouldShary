"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch } from "@/lib/api";

export function ShareModal({ fileId, fileName }: { fileId: string, fileName: string }) {
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
                    expiresAt: useExpiry ? new Date(expiresAt).toISOString() : undefined,
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
        if (shareUrl) navigator.clipboard.writeText(shareUrl);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
                Share
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share "{fileName}"</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="link">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="link">Share Link</TabsTrigger>
                        <TabsTrigger value="people">Specific People</TabsTrigger>
                    </TabsList>

                    <TabsContent value="link" className="pt-4">
                        {!shareUrl ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox checked={usePassword} onCheckedChange={(v) => setUsePassword(!!v)} id="use-password" />
                                    <Label htmlFor="use-password">Password protect</Label>
                                </div>
                                {usePassword && (
                                    <Input
                                        type="password"
                                        placeholder="Enter a password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                )}

                                <div className="flex items-center gap-2">
                                    <Checkbox checked={useExpiry} onCheckedChange={(v) => setUseExpiry(!!v)} id="use-expiry" />
                                    <Label htmlFor="use-expiry">Set expiration</Label>
                                </div>
                                {useExpiry && (
                                    <Input
                                        type="datetime-local"
                                        value={expiresAt}
                                        onChange={(e) => setExpiresAt(e.target.value)}
                                    />
                                )}

                                {error && <p className="text-sm text-destructive">{error}</p>}
                                <Button onClick={handleCreate} disabled={loading} className="w-full">
                                    {loading ? "Creating..." : "Create Share Link"}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">Share this link:</p>
                                <div className="flex gap-2">
                                    <Input readOnly value={shareUrl} />
                                    <Button onClick={copyLink}>Copy</Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="people" className="pt-4">
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

    const loadGrants = async () => {
        const data = await apiFetch(`/files/${fileId}/access`);
        setGrants(data.grants);
    };

    useEffect(() => { loadGrants(); }, [fileId]);

    const addGrant = async () => {
        setError(null);
        try {
            await apiFetch(`/files/${fileId}/access`, {
                method: "POST",
                body: JSON.stringify({ email, permission: "DOWNLOAD" }),
            });
            setEmail("");
            loadGrants();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const removeGrant = async (userId: string) => {
        await apiFetch(`/files/${fileId}/access/${userId}`, { method: "DELETE" });
        loadGrants();
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <Input placeholder="person@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button onClick={addGrant}>Add</Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-1">
                {grants.map((g) => (
                    <div key={g.user.id} className="flex justify-between items-center text-sm">
                        <span>{g.user.email} ({g.permission})</span>
                        <Button variant="ghost" size="sm" onClick={() => removeGrant(g.user.id)}>Remove</Button>
                    </div>
                ))}
            </div>
        </div>
    );
}