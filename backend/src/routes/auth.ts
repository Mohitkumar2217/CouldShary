import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
    loginController,
    registerController,
    forgotPasswordController,
    resetPaaawordController,
    deleteAccountController,
    verifyEmailController,
    resendVerificationController,
    refreshTokenController
} from "../controller/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// rate limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes wait
    max: 10, // 10 attempts per IP per window
    message: {
        success: false,
        message: "Too many requests. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post("/register", authLimiter, registerController);
router.post("/login", authLimiter, loginController);
router.post("/forgot-password", authLimiter, forgotPasswordController);
router.post("/reset-password", authLimiter, resetPaaawordController);
router.delete("/account", requireAuth, deleteAccountController);
router.post("/verify-email", verifyEmailController);
router.post("/resend-verification", authLimiter, resendVerificationController);
router.post("/refresh", refreshTokenController);

export default router;
