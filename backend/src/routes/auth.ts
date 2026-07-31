import { Router } from "express";
import rateLimit from "express-rate-limit";  
import { loginController, registerController } from "../controller/authController.js";

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


export default router;
