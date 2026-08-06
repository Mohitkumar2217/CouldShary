import type { Request, Response } from "express";
import path from "path";
import { randomUUID, createHash } from "crypto";
import { prisma } from "../db.js";
import { supabaseAdmin } from "../supabase.js";
import { thumbnailQueue } from "../queues/index.js";
import { error } from "console";

const ALLOWED_MIME_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "text/plain", "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "video/mp4", "video/quicktime",
    // will add more as needed for use case
];

export const uploadFileController = async (req: Request, res: Response) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                error: "No file provided",
            });
        }
        const { originalname, mimetype, size, buffer } = req.file;
        const { folderId } = req.body;  // optional - null means root

        if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
            return res.status(400).json({
                error: "File type not allowed"
            });
        }

        const contentHash = createHash("sha256").update(buffer).digest("hex");

        const existing = await prisma.file.findFirst({
            where: {
                ownerId: req.user!.userId,
                contentHash,
                deletedAt: null,
            }
        })

        if (existing) {
            const file = await prisma.file.create({
                data: {
                    name: originalname,
                    size,
                    mimeType: mimetype,
                    storageKey: existing.storageKey, // same underlying bytes, no re-upload
                    contentHash,
                    ownerId: req.user!.userId,
                    folderId: folderId || null,
                },
            });

            return res.status(200).json({
                file,
                deduplicated: true,
            });
        }

        // Namespace the storage key by user + a random suffix to avoid collisions
        const ext = path.extname(originalname);
        const storageKey = `${req.user!.userId}/${randomUUID()}${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from(process.env.SUPABASE_STORAGE_BUCKET!)
            .upload(
                storageKey,
                buffer,
                {
                    contentType: mimetype,
                    upsert: false,
                }
            );

        if (uploadError) {
            res.status(500).json({
                error: "Upload failed",
                details: uploadError.message
            });
        }


        const file = await prisma.file.create({
            data: {
                name: originalname,
                size,
                mimeType: mimetype,
                storageKey,
                contentHash,
                ownerId: req.user!.userId,
                folderId: folderId || null,
            },
        });

        // successfull upload the queue for maintain losses
        await thumbnailQueue.add("generate-thumbnail", {
            fileId: file.id,
            mimeType: file.mimeType,
            storageKey,
        });

        res.status(201).json({
            file,
            deduplicated: false,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal sever error"
        });
    }
}

export const downloadFileController = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        if (typeof id !== "string") {
            return res.status(400).json({
                error: "Invalid file id",
            });
        }

        const file = await prisma.file.findUnique({
            where: { id },
        });

        if (!file || file.deletedAt) {
            return res.status(404).json({
                error: "File not found",
            });
        }

        // ownership check - the core of Phase - 11's, worth doing now
        if (file.ownerId !== req.user!.userId) {
            return res.status(403).json({
                error: "Forbidden",
            });
        }

        const { data, error } = await supabaseAdmin.storage
            .from(process.env.SUPABASE_STORAGE_BUCKET!)
            .createSignedUrl(file.storageKey, 60 * 5); // 5 - minute expiry

        if (error || !data) {
            return res.status(500).json({
                error: "Could not generate download link"
            });
        }

        res.status(200).json({
            url: data.signedUrl,
            expiresIn: 300,
        });
    } catch (err) {
        console.log(err);

        return res.status(500).json({
            error: "Internal Server error",
        })
    }
}

export const thumbnailController = async (req: Request, res: Response) => {
    try {
        const file = await prisma.file.findUnique({
            where: {
                id: req.params.id as any,
            }
        });

        if (!file || file.deletedAt) return res.status(404).json({
            error: "File not found"
        });
        if (file.ownerId !== req.user?.userId) return res.status(403).json({
            error: "Forbidden"
        });
        if (!file.thumbnailKey) return res.status(404).json({
            error: "Thumbnail not yet availbale"
        });

        const { data, error } = await supabaseAdmin.storage
            .from(process.env.SUPABASE_STORAGE_BUCKET!)
            .createSignedUrl(file.thumbnailKey, 60 * 5);

        if (error || !data) return res.status(500).json({
            error: "Could not generate thumbnail"
        });

        return res.status(200).json({
            url: data.signedUrl
        });
    } catch (err) {
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}