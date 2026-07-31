import { Router } from "express";
import multer from "multer"; 
import { requireAuth } from "../middleware/auth.js";
import { downloadFileController, uploadFileController } from "../controller/uploadFileController.js";

const router = Router();

// store the file in memory temporarily, then stream it to Supabase - never write to disk
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 50 * 1024 * 1024}, // 50mb cap for this basic version
});

router.post("/upload", requireAuth, upload.single("file"), uploadFileController);
router.get("/:id/download", requireAuth, downloadFileController);

export default router;