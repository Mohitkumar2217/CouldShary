import type { Request, Response } from "express";
import path from "path";
import { randomUUID, createHash } from "crypto";
import { prisma } from "../db.js";
import { supabaseAdmin } from "../supabase.js";


export const uploadFileController = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: "No file provided",
            });
        }
        const { originalname, mimetype, size, buffer } = req.file;
        const { folderId } = req.body;  // optional - null means root
        const contentHash = createHash("sha256").update(buffer).digest("hex");

        const existing = await prisma.file.findFirst({
            where: {
                ownerId: req.user!.userId,
                contentHash,
                deletedAt: null,
            }
        })

        if (existing) {
            return res.status(200).json({
                file: existing,
                message: "Identical file already exists - reused existing copy",
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
                contentHash,
                storageKey,
                ownerId: req.user!.userId,
                folderId: folderId || null,
            },
        });

        res.status(201).json({ file });
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