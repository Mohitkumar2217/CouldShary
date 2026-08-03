import { Worker } from "bullmq";
import { prisma } from "../db.js";
import { redis } from "../redis.js";

export const cleanupWorker = new Worker(
    "cleanup",
    async (job) => {
        try {
            if (job.name === "deactivate-expired-links") {
                const result = await prisma.shareLink.updateMany({
                    where: {
                        expiresAt: { lt: new Date() },
                        revokedAt: null,
                    },
                    data: { revokedAt: new Date() },
                });
                console.log(`[cleanup] Deactivate ${result.count} expired share links`);
            }

            if (job.name === "purge-soft-deleted-files") {
                const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

                const filesToPurge = await prisma.file.findMany({
                    where: { deletedAt: { lt: THIRTY_DAYS_AGO } },
                });

                for (const file of filesToPurge) {
                    // actual supabase deletion wired below
                    console.log(`[cleanup] Would permanently purge file ${file.id} (${file.name})`);
                }
            }
        } catch(err) {
            console.log(err);
            throw err;
        }
    },
    { connection: redis }
);

cleanupWorker.on("failed", (job, err) => {
    console.log(`[cleanup] Job ${job?.id} (${job?.name}) failed:`, err.message);
});
