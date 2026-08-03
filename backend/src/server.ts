import dotenv from "dotenv";
dotenv.config();
import "./workers/emailWorker.js";
import "./workers/cleanupWorkers.js";
import "./workers/thumbnailWorker.js";
import { scheduleReapeatableJobs } from "./queues/scheduler.js";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import { requireAuth, requireRole } from "./middleware/auth.js";
import filesRoutes from "./routes/files.js";
import chunkedUploadRoutes from "./routes/chunkedUpload.js";
import folderRoutes from "./routes/folders.js";
import shareLinkRoutes from "./routes/shareLinks.js";

const app = express();

// npm install @bull-board/express @bull-board/api 
// bullmq not support in v6 use v5 

// import { createBullBoard } from "@bull-board/api";
// import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
// import { ExpressAdapter } from "@bull-board/express";
// import { emailQueue, cleanupQueue, thumbnailQueue } from "./queues";

// const serverAdapter = new ExpressAdapter();
// serverAdapter.setBasePath("/admin/queues");

// createBullBoard({
//   queues: [new BullMQAdapter(emailQueue), new BullMQAdapter(cleanupQueue), new BullMQAdapter(thumbnailQueue)],
//   serverAdapter,
// });

// app.use("/admin/queues", serverAdapter.getRouter());

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes); 
app.use("/files", filesRoutes);
app.use("/files", chunkedUploadRoutes);
app.use("/folders", folderRoutes);
app.use("/", shareLinkRoutes);

app.get("/me", requireAuth, (req, res) => {
  res.json({user: req.user});
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));

// after app. listen(...)
scheduleReapeatableJobs();