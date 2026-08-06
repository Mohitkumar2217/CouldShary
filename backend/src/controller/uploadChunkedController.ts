import type { Request, Response } from "express"
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";
import { createHash } from "crypto";
import fsPromises from "fs/promises";
import { readFile } from "fs/promises";
import { redis } from "../redis.js";
import { supabaseAdmin } from "../supabase.js";
import { prisma } from "../db.js";

const TEMP_DIR = path.join(process.cwd(), "tmp-uploads");
fs.mkdirSync(TEMP_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "text/plain", "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "video/mp4", "video/quicktime",
    // add more as needed for your use case
];

export const initializeController = async (req: Request, res: Response) => {
    try {
        const { filename, mimetype, size, totalChunks, folderId } = req.body;


        if (!filename || !mimetype || !size || !totalChunks) {
            return res.status(400).json({
                error: "Missing required fields"
            });
        }

        if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
            return res.status(400).json({
                error: "File type not allowed"
            });
        }

        const uploadId = nanoid();
        const tempFilePath = path.join(TEMP_DIR, uploadId);
 
        await fsPromises.writeFile(tempFilePath, "");

        await redis.hset(`upload:${uploadId}`, {
            ownerId: req.user!.userId,
            filename,
            mimetype,
            size,
            totalChunks,
            folderId: folderId || "",
            receivedChunks: 0,
            tempFilePath,
        });

        await redis.expire(`upload:${uploadId}`, 60 * 60 * 24); // 24h TTL- abandoned uploads auto-clean

        return res.status(201).json({ uploadId });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server error",
        })
    }
}

export const chunkUploadController = async (req: Request, res: Response) => {
    try {
        const { uploadId } = req.params;
        const { chunkIndex } = req.body;

        const session = await redis.hgetall(`upload:${uploadId}`);
        if (!session.tempFilePath) {
            return res.status(404).json({
                error: "Upload session not found or expired"
            })
        }

        if (session.ownerId !== req.user!.userId) {
            return res.status(403).json({
                error: "Forbidden"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                error: "No chunk provided"
            });
        }

        // append this chunk's bytes to the temp file.
        // Client must send chunks in order (await each response before sending the next).
        await fsPromises.appendFile(session.tempFilePath, req.file.buffer);

        const receivedChunks = await redis.hincrby(`upload:${uploadId}`, "receivedChunks", 1);

        return res.status(201).json({
            receivedChunks, totalChunks: Number(session.totalChunks)
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}

export const statusController = async (req: Request, res: Response) => {
    try {
        const session = await redis.hgetall(`upload:${req.params.uploadId}`);
        if (!session.tempFilePath) {
            return res.status(404).json({
                error: "Upload session not found or expired"
            });
        }

        return res.status(200).json({
            receivedChunks: Number(session.receivedChunks),
            totalChunks: Number(session.totalChunks),
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}

export const completeUploadController = async (req: Request, res: Response) => {
    try {
        const { uploadId } = req.params;
        const session = await redis.hgetall(`upload:${uploadId}`);

        if (!session.tempFilePath) {
            return res.status(404).json({ error: "Upload session not found or expired" });
        }
        if (session.ownerId !== req.user!.userId) {
            return res.status(403).json({ error: "Forbidden" });
        }
        if (Number(session.receivedChunks) !== Number(session.totalChunks)) {
            return res.status(400).json({
                error: "Not all chunks received",
                receivedChunks: session.receivedChunks,
                totalChunks: session.totalChunks,
            });
        }

        // Compute the hash FIRST, before deciding whether to upload at all
        const fileBuffer = await readFile(session.tempFilePath);
        const contentHash = createHash("sha256").update(fileBuffer).digest("hex");

        const existing = await prisma.file.findFirst({
            where: { ownerId: req.user!.userId, contentHash, deletedAt: null },
        });

        if (existing) {
            // Skip the Supabase upload entirely — reuse the existing storage object
            await fsPromises.unlink(session.tempFilePath).catch(() => {});
            await redis.del(`upload:${uploadId}`);

            const file = await prisma.file.create({
                data: {
                    name: session.filename,
                    size: Number(session.size),
                    mimeType: session.mimetype,
                    storageKey: existing.storageKey, // same bytes, no re-upload
                    contentHash,
                    ownerId: req.user!.userId,
                    folderId: session.folderId || null,
                },
            });

            return res.status(200).json({ file, deduplicated: true });
        }

        const ext = path.extname(session.filename);
        const storageKey = `${req.user!.userId}/${uploadId}${ext}`;

        const fileStream = fs.createReadStream(session.tempFilePath);

        const { error: uploadError } = await supabaseAdmin.storage
            .from(process.env.SUPABASE_STORAGE_BUCKET!)
            .upload(storageKey, fileStream, {
                contentType: session.mimetype, // fixed: was `mimeType`
                duplex: "half",
            } as any);

        await fsPromises.unlink(session.tempFilePath).catch(() => {});
        await redis.del(`upload:${uploadId}`);

        if (uploadError) {
            return res.status(500).json({
                error: "Upload to storage failed",
                details: uploadError.message,
            });
        }

        const file = await prisma.file.create({
            data: {
                name: session.filename,
                size: Number(session.size),
                mimeType: session.mimetype,
                storageKey,
                contentHash,
                ownerId: req.user!.userId,
                folderId: session.folderId || null,
            },
        });

        return res.status(201).json({ file, deduplicated: false });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};