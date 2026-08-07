import { Router } from "express";
import multer from "multer"; 
import { requireAuth } from "../middleware/auth.js";
import { 
    downloadFileController, 
    thumbnailController, 
    uploadFileController,
    deleteFileController } from "../controller/uploadFileController.js";
import rateLimit from "express-rate-limit";

const router = Router();

// store the file in memory temporarily, then stream it to Supabase - never write to disk
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 50 * 1024 * 1024}, // 50mb cap for this basic version
});

const uploadLimiter = rateLimit({
    windowMs: 60 * 100,
    max:20, // 10 upploads per minute per IP
});  

router.post("/upload", uploadLimiter, requireAuth, upload.single("file"), uploadFileController);
router.get("/:id/download", requireAuth, downloadFileController);
router.get("/:id/thumbnail", requireAuth, thumbnailController);
router.delete("/:id", uploadLimiter, requireAuth, deleteFileController);

export default router;