import { Worker } from "bullmq";
import { redis } from "../redis.js";

export const emailWorker = new Worker(
    "email",
    async (job) => {
        const { to, subject, body } = job.data;
        // actual sending next phase (Resend)
        console.log(`[email] would send to ${to}: "${subject}"`);
        // await resend.emails.send({ to, subject, html: body });
    },
    { connection: redis}
);

emailWorker.on("failed", (job, err) => {
    console.error(`[email] Job ${job?.id} failed:`, err.message);
});