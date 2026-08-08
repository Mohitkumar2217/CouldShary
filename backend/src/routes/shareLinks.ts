import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createLinkController, listFileLinkController, passwordDownloadLinkController, revokeController, shareLinkMetadate, shareLinksController } from "../controller/sharLinksController.js";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
const router = Router();
const passwordAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    return req.user?.userId ?? ipKeyGenerator(req.ip!); // per-ip in future per user can be replace by (req) => req.user!.userId
  },
});
// create a share link for a file
router.post("/files/:fileId/share", requireAuth, createLinkController);
// list a files share links (owner only)
router.get("/files/:fileId/share", requireAuth, listFileLinkController);
// revoke share link
router.delete("/share/:id", requireAuth, revokeController);
// public: get share link metadata (no auth required)
router.get("/share/:token", passwordAttemptLimiter, shareLinkMetadate);
// public: verify password + get a download link
router.post("/share/:token/download", passwordAttemptLimiter, passwordDownloadLinkController);
router.get("/share-links", requireAuth, shareLinksController);

export default router;