import { Queue } from "bullmq";
import { redis } from "../redis.js";

const connection = redis;

export const emailQueue = new Queue("email", { connection });
export const cleanupQueue = new Queue("cleanup", { connection });
export const thumbnailQueue = new Queue("thumbnail", { connection });