import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { chunkUploadController, initializeController } from "../controller/uploadChunkedController.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage()});

// initialize an upload session
router.post("/upload/init", requireAuth, initializeController);
// upload a single chunk
router.post("/upload/chunk/:uploadId", requireAuth, upload.single("chunk"), chunkUploadController);
// check upload status (resuming after a disconnect)
router.get("/upload/status/:uploadId", requireAuth, );
// complete the upload: stream temp file to supabase
router.post("/upload/complete/:uploadId", requireAuth, );

export default router;