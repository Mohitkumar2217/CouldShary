import { cleanupQueue } from "./index.js";

export async function scheduleReapeatableJobs() {
    await cleanupQueue.upsertJobScheduler(
        "deactivate-expired-links",
        {
            every: 15 * 60 * 1000,
        },
        {  
            name: "deactivate-expired-links",
            data: {},
        } // every 15 min
    );

    await cleanupQueue.upsertJobScheduler(
        'purge-soft-deleted-files',
        {
            every: 24 * 60 * 60 * 1000,
        },
        {
            name: "purge-soft-deleted-files",
            data: {},
        } // daily
    );

    console.log("[queue] Repeatable jobs scheduled");
}
