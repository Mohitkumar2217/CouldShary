import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { accessController, deleteAccessController } from "../controller/fileAccessController.js";

const router = Router();

router.post("/files/:fileId/access", requireAuth, accessController);
router.delete("/files/:fileId/access/:userId", requireAuth, deleteAccessController);

export default router;