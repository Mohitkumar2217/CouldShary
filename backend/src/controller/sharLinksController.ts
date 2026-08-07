import type { Request, Response } from "express"
import { prisma } from "../db.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { nanoid } from "nanoid";
import { supabaseAdmin } from "../supabase.js";
import { shareNotificationEmail } from "../templates/emailTemplates.js";
import { emailQueue } from "../queues/index.js";

export const createLinkController = async (req: Request, res: Response) => {
    try {
        const { fileId } = Array.isArray(req.params) ? req.params[0] : req.params;
        const { visibility, password, expiresAt, maxDownloads } = req.body;

        const file = await prisma.file.findUnique({
            where: {
                id: fileId,
            }
        });
        if (!file || file.deletedAt) {
            return res.status(404).json({
                error: "File not Found"
            });
        }
        if (file.ownerId !== req.user!.userId) {
            return res.status(403).json({
                error: "Forbidden"
            });
        }

        const passwordHash = password ? await hashPassword(password) : null;

        const shareLink = await prisma.shareLink.create({
            data: {
                token: nanoid(12),
                fileId,
                visibility: visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE",
                passwordHash,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                maxDownloads: maxDownloads ? Number(maxDownloads) : null,
                createdById: req.user!.userId,
            },
        });

        if(req.body.recipientEmail) {
            const { subject, html } = shareNotificationEmail(file.name, `${process.env.FRONTEND_URL}/share/${shareLink.token}`);
            await emailQueue.add("send-email", { 
                to: req.body.recipientEmail,
                subject, 
                html
            });
        }
        return res.status(201).json({
            shareLink: {
                ...shareLink,
                passwordHash: undefined, // never return the hash to the client
                url: `${process.env.FRONTEND_URL}/share/${shareLink.token}`,
            },
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}

export const listFileLinkController = async (req: Request, res: Response) => {
    try {
        const fileId = Array.isArray(req.params.fileId) ? req.params.fileId[0] : req.params.fileId;
        const file = await prisma.file.findUnique({
            where: {
                id: fileId
            }
        });
        if (!file || file.ownerId !== req.user!.userId) {
            return res.status(403).json({
                error: "Forbidden"
            });
        }

        const links = await prisma.shareLink.findMany({
            where: {
                fileId: fileId,
                revokedAt: null,
            }
        });

        return res.status(200).json({
            shareLinks: links.map((l) => ({
                ...l,
                passwordHash: undefined
            }))
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}

// revoke a shar link
export const revokeController = async (req: Request, res: Response) => {
    try {
        const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const link = await prisma.shareLink.findUnique({
            where: {
                id: fileId,
            }
        });
        if (!link) return res.status(404).json({
            error: "Share Link not Found"
        });
        if (link.createdById !== req.user!.userId) {
            return res.status(403).json({
                error: "Forbidden"
            });
        }

        await prisma.shareLink.update({
            where: {
                id: fileId,
            },
            data: {
                revokedAt: new Date(),
            }
        });

        return res.status(200).json({
            message: "share link revoked"
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error"
        })
    }
}

export const shareLinkMetadate = async (req: Request, res: Response) => {
    try {

        const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
        const link = await prisma.shareLink.findUnique({
            where: {
                token: token,
            },
            include: {
                file: true
            },
        });

        if (!link || link.revokedAt) {
            return res.status(404).json({
                error: "Share link not found"
            });
        }
        if (link.expiresAt && link.expiresAt < new Date()) {
            return res.status(410).json({
                error: "This share link has expired",
            });
        }
        if (link.maxDownloads && link.downloadCount >= link.maxDownloads) {
            return res.status(410).json({
                error: "This share link has reached its download limit"
            });
        }
        if (!link.file || link.file.deletedAt) {
            return res.status(404).json({
                error: "File no longer available"
            });
        }

        res.status(200).json({
            file: {
                name: link.file.name,
                size: link.file.size,
                mimeType: link.file.mimeType,
            },
            requiresPassword: !!link.passwordHash,   
            visibility: link.visibility,             
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Intrenal Server Error"
        });
    }
}

export const passwordDownloadLinkController = async (req: Request, res: Response) => {
    try {
        const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
        const { password } = req.body;

        const link = await prisma.shareLink.findUnique({
            where: {
                token: token,
            },
            include: {
                file: true
            },
        });

        if (!link || link.revokedAt) {
            return res.status(404).json({
                error: "Share Link not found"
            });
        }
        if (link.expiresAt && link.expiresAt < new Date()) {
            return res.status(410).json({
                error: "This share link has expired"
            });
        }
        if (link.maxDownloads && link.downloadCount >= link.maxDownloads) {
            return res.status(410).json({
                error: "This share link has reached its download limit"
            });
        }
        if (!link.file || link.file.deletedAt) {
            return res.status(404).json({
                error: "File no longer available"
            });
        }

        if (link.passwordHash) {
            const valid = password && (await verifyPassword(password, link.passwordHash));
            if (!valid) {
                // same generic message whether password is missing or wrong - avoids leaking state
                return res.status(401).json({
                    error: "Incorrect password"
                });
            }
        }

        const { data, error } = await supabaseAdmin.storage
            .from(process.env.SUPABASE_STORAGE_BUCKET!)
            .createSignedUrl(link.file.storageKey, 60 * 5);

        if(error || !data) {
            return res.status(500).json({
                error: "Couldn ot generate download link"
            });
        }

        await prisma.shareLink.update({
            where: {
                id: link.id,
            },
            data: {
                downloadCount: {
                    increment: 1
                }
            },
        });

        return res.status(200).json({
            url: data.signedUrl,
            expiresIn: 300
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}