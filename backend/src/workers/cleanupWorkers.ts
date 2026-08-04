import { Worker } from "bullmq";
import { prisma } from "../db.js";
import { redis } from "../redis.js";
import { expiryReminderEmail } from "../templates/emailTemplates.js";
import { emailQueue } from "../queues/index.js";

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

            if (job.name === "send-expiry-reminders") {
                const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
                const soon = await prisma.shareLink.findMany({
                    where: {
                        expiresAt: { gt: new Date(), lt: in24h },
                        revokedAt: null,
                    },
                    include: { file: true, createdBy: true },
                });

                for (const link of soon) {
                    const hoursLeft = Math.round((link.expiresAt!.getTime() - Date.now()) / (60 * 60 * 1000));
                    const { subject, html } = expiryReminderEmail(
                        link.file.name,
                        `${process.env.FRONTEND_URL}/share/${link.token}`,
                        hoursLeft,
                    );

                    await emailQueue.add("send-email", {
                        to: link.createdBy.email,
                        subject,
                        html,
                    });
                }
            }
        } catch (err) {
            console.log(err);
            throw err;
        }
    },
    { connection: redis }
);

cleanupWorker.on("failed", (job, err) => {
    console.log(`[cleanup] Job ${job?.id} (${job?.name}) failed:`, err.message);
});
