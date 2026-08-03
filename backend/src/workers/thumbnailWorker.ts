import { Worker } from "bullmq";
import { redis } from "../redis.js";

export const thumbnailWorker = new Worker(
    "thumbnail",
    async (job) => {
        const { fileId, mimeType } = job.data;
        if(!mimeType.startsWith("image/")) return; // only images for now

        console.log(`[thumbnail] Would generate thumbnail for file ${fileId}`);
        // Real implementation: download original from supabase, resize with 'sharp'
        // upload the rsized verison back under a 'thumbnails/' prefix
    },
    { connection: redis }
);