import { Worker } from "bullmq";
import sharp from "sharp";
import { redis } from "../redis.js";
import { supabaseAdmin } from "../supabase.js";
import { prisma } from "../db.js";

export const thumbnailWorker = new Worker(
    "thumbnail",
    async (job) => {
        const { fileId, mimeType, storageKey } = job.data;
        if (!mimeType.startsWith("image/")) return;

        const { data: original, error: downloadError } = await supabaseAdmin.storage
            .from(process.env.SUPABASE_STORAGE_BUCKET!)
            .download(storageKey);

        if (downloadError || !original) {
            throw new Error(`Could not download original for thumbnail: ${downloadError?.message}`);
        }

        const buffer = Buffer.from(await original.arrayBuffer());

        const thumbnailBuffer = await sharp(buffer)
            .resize(300, 300, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

        const thumbnailKey = `thumbnails/${storageKey.replace(/\.[^.]+$/, "")}.jpg`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from(process.env.SUPABASE_STORAGE_BUCKET!)
            .upload(thumbnailKey, thumbnailBuffer, { contentType: "image/jpeg", upsert: true });

        if (uploadError) {
            throw new Error(`Could not upload thumbnail: ${uploadError.message}`);
        }

        await prisma.file.update({
            where: { id: fileId },
            data: { thumbnailKey } as any
        });
        console.log(`[thumbnail] Generated thumbnail for file ${fileId}`);
    },
    { connection: redis }
);

thumbnailWorker.on("failed", (job, err) => {
    console.error(`[thumbnail] Job ${job?.id} failed:`, err.message);
});