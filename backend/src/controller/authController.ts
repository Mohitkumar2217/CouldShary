import type { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { verificationEmail } from "../templates/emailTemplates.js";
import { emailQueue } from "../queues/index.js";
import { softDeleteFolderRecursive } from "./folderController.js";
import { error } from "console";

export const registerController = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Credentials required",
            });
        }

        const existing = await prisma.user.findUnique({
            where: {
                email,
                deletedAt: null,
            },
        });

        if (existing) {
            return res.status(409).json({
                error: "Email already registered",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({ 
                error: "Password must be at least 8 characters" 
            });
        }

        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
            },
        });

        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        await prisma.user.update({
            where: {id: user.id},
            data: {
                emailVerificationTokenHash: tokenHash,
                emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
            },
        });

        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${rawToken}`;
        const { subject, html } = verificationEmail(user.name || "there", verifyUrl);
        await emailQueue.add('send-email', {
            to: user.email,
            subject,
            html
        });

        const accessToken = signAccessToken({
            userId: user.id,
            role: user.role,
        });

        const refreshToken = signRefreshToken({
            userId: user.id,
            role: user.role,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // return res.status(201).json({
        //     accessToken,
        //     user: {
        //         id: user.id,
        //         email: user.email,
        //         name: user.name,
        //     },
        // });
        return res.status(201).json({
            message: "Registered. Check your email to verify your account."
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal Server Error",
        });
    }
};


export const loginController = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                error: "Credentials Reuired",
            });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || user.deletedAt || !(await verifyPassword(password, user.passwordHash))) {
            return res.status(401).json({
                error: "Invalid Email or Password"
            })
        }

        if(!user.verified) {
            return res.status(403).json({
                error: "Please verify your email before logging in.", 
                unverified: true
            })
        }

        const accessToken = signAccessToken({
            userId: user.id,
            role: user.role
        });
        const refreshToken = signRefreshToken({
            userId: user.id,
            role: user.role
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            }
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            error: "Internal Server Error",
        });
    }
}

export const forgotPasswordController = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                error: "Email Required"
            });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        // always respond the same way whether the email exists or not - avoids
        // leaking which emails are registered (enumeration protection)
        const genericResponse = { message: "If that email is registered, a reset link has been sent." };

        if (!user || user.deletedAt) {
            return res.status(404).json(genericResponse);
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        //SHA-256, not bcrypt: this token is already high-entropy random data (unlike a human password), so we need fast lookup, not slow salted hashing
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordTokenHash: tokenHash,
                resetPasswordExpireAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour 
            },
        });

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
        await emailQueue.add("send-email", {
            to: user.email,
            subject: "Reset your password",
            html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>Click below to set a new password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
            <p style="color:#666;font-size:12px;margin-top:20px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        `,
        });

        res.status(200).json(genericResponse);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Internal Server Error",
        });
    }
}

export const resetPaaawordController = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                error: "Token and new password required"
            });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({
                error: "Password must be at least 8 characters"
            });
        }

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        const user = await prisma.user.findUnique({
            where: {
                resetPasswordTokenHash: tokenHash
            }
        });

        if (!user || !user.resetPasswordExpireAt || user.resetPasswordExpireAt < new Date()) {
            return res.status(400).json({
                error: "Invalid or expired reset link"
            });
        }

        const passwordHash = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetPasswordTokenHash: null,
                resetPasswordExpireAt: null,
            },
        });

        res.status(200).json({
            message: "Password updated successfully"
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}

export const deleteAccountController = async (req: Request, res: Response) => {
    try {
        const { password } = req.body;

        const user = await prisma.user.findUnique({
            where: {
                id: req.user!.userId,
            }
        });
        if (!user || !(verifyPassword(password, user.passwordHash))) {
            res.status(401).json({
                error: "Incorrect password"
            });
        }

        const now = new Date();

        // casecade soft-delete: root-level folders (recursively handlers nested contents)
        const rootFolders = await prisma.folder.findMany({
            where: {
                ownerId: user?.id,
                parentFolderId: null,
                deletedAt: null
            },
        });
        for (const folder of rootFolders) {
            await softDeleteFolderRecursive(folder.id, user!.id);
        }

        // root-level files (not in folder)

        await prisma.file.updateMany({
            where: {
                ownerId: user?.id,
                folderId: null,
                deletedAt: null,
            },
            data: {
                deletedAt: now
            },
        });

        // revoke all active share links this user created
        await prisma.shareLink.updateMany({
            where: {
                createdById: user?.id,
                revokedAt: null,
            },
            data: {
                revokedAt: now
            },
        });

        // permanent-delete the user account itself
        await prisma.user.delete({
            where: { id: user?.id }
        });

        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Account deleted" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}

export const verifyEmailController = async (req: Request, res: Response) => {
    const {token} = req.body;
    if(!token) {
        return res.status(400).json({
            errpr: "Token required"
        });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findUnique({where: { emailVerificationTokenHash: tokenHash}});

    if(!token || !user?.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
        return res.status(400).json({
            error: "Invalid or expired verification link"
        });
    }
    
    await prisma.user.update({
        where: {id: user.id},
        data: {
            verified: true,
            emailVerificationTokenHash: null,
            emailVerificationExpiresAt: null,
        }
    });

    return res.status(200).json({
        message: "Email verified. You can now log in."
    });
}

export const resendVerificationController = async (req: Request, res: Response) => {
    try {
        const {email } = req.body;
        const user = await prisma.user.findUnique({where: {email}});

        const generic = {message: "If that acccount exists and its unverified, a new email has been sent."};
        if(!user || user?.verified || user?.deletedAt) {
            return res.status(200).json(generic);
        } 

        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        await prisma.user.update({
            where: {id: user.id},
            data: { emailVerificationTokenHash: tokenHash, emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)},
        });

        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${rawToken}`;
        const { subject, html} = verificationEmail(user.email || "there", verifyUrl);
        await emailQueue.add("send-email", {to: user.email, subject, html});

        return res.status(200).json({
            generic
        });
    } catch(err) {
        return res.status(500).json({
            error:"Internal Server Error"
        });
    }
}