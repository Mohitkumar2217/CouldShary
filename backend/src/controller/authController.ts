import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";

export const registerController = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Credentials required",
            });
        }

        const existing = await prisma.user.findUnique({
            where: { email },
        });

        if (existing) {
            return res.status(409).json({
                error: "Email already registered",
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

        return res.status(201).json({
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
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
        if (!user || !(await verifyPassword(password, user.passwordHash))) {
            return res.status(401).json({
                error: "Invalid Email or Password"
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