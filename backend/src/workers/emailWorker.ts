import { Worker } from "bullmq";
import { redis } from "../redis.js";
import { resend } from "../email.js";

export const emailWorker = new Worker(
    "email",
    async (job) => {
        const { to, subject, html } = job.data;
        // actual sending next phase (Resend)
        const {error} = await resend.emails.send({
            from: process.env.EMAIL_FROM!,
            to,
            subject,
            html,
        });

        if(error) {
            throw new Error(`Resend Failed: ${error?.message}`); // lets BullMQ retry
        }

        console.log(`[email] sent to ${to}: "${subject}"`);
    },
    { connection: redis }
);

emailWorker.on("failed", (job, err) => {
    console.error(`[email] Job ${job?.id} failed:`, err.message);
});