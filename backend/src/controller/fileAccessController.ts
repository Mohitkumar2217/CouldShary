import type { Request, Response } from "express"
import { prisma } from "../db.js";

export const accessController = async (req: Request, res: Response) => {
    try {
        const { email, permission } = req.body; // permission: VIEW | DOWNLOAD | EDIT;
        const fileId = Array.isArray(req.params.fileId) ? req.params.fileId[0] : req.params.fileId;
        const file = await prisma.file.findUnique({
            where: {
                id: fileId,
            }
        });

        if(!file || file.ownerId !== req.user!.userId) {
            return res.status(403).json({
                error: "Forbidden"
            });
        }

        const targetUser = await prisma.user.findUnique({
            where: {email}
        });
        if(!targetUser) {
            return res.status(404).json({
                error: "No user with that email"
            });
        }

        const grant = await prisma.fileAccessGrant.upsert({
            where: {fileId_userId: { 
                fileId: fileId,
                userId: targetUser.id
            }},
            update: { permission: permission || "VIEW"},
            create: {
                fileId: fileId, 
                userId: targetUser.id,
                permission: permission || "VIEW"
            }
        });

        return res.status(201).json({
            grant
        });
    } catch(err) {
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}

export const deleteAccessController = async (req: Request, res: Response) => {
    try {
        const fileId = Array.isArray(req.params.fileId) ? req.params.fileId[0] : req.params.fileId;
        const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
        const file = await prisma.file.findUnique({
            where: {
                id: fileId,
            }
        });

        if(!file || file.ownerId !== req.user!.userId) {
            return res.status(403).json({
                error: "Forbidden"
            });
        }

        await prisma.fileAccessGrant.delete({
            where: {
                fileId_userId: {
                    fileId: fileId,
                    userId: userId,
                }
            }
        });

        return res.status(200).json({
            message: "Access revoked"
        });
    } catch(err) {
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}