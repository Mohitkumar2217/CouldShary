import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { breadcrumbController, createFolderController, deleteFolderController, listContentController, moveFileController, moveFolderController, renameController } from "../controller/folderController.js";

const router = Router();

// Create a folder
router.post("/", requireAuth, createFolderController);
// List contents of a folder (or root if no folderId)
router.get("/", requireAuth, listContentController);
// Get breadcrumb path for a folder
router.get("/:id/breadcrumbs", requireAuth, breadcrumbController);
// Rename a folder
router.patch("/:id", requireAuth, renameController);
// Move a folder (into a new parent, or to root)
router.patch("/:id/move", requireAuth, moveFolderController);
// Move a file into a folder
router.patch("/files/:id/move", requireAuth, moveFileController);
// Delete a folder (soft delete, recursive)
router.delete("/:id", requireAuth, deleteFolderController);

export default router;