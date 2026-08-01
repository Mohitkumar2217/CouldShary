import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import { requireAuth, requireRole } from "./middleware/auth.js";
import filesRoutes from "./routes/files.js";
import chunkedUploadRoutes from "./routes/chunkedUpload.js";

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes); 
app.use("/files", filesRoutes);
app.use("/files", chunkedUploadRoutes);

app.get("/me", requireAuth, (req, res) => {
  res.json({user: req.user});
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));