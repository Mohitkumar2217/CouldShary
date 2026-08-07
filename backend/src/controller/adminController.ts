import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { softDeleteFolderRecursive } from "../controller/folderController.js";


export const allUsersController = async (req: Request, res: Response) => {
    try {

        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true, email: true, name: true, role: true, verified: true,
                suspended: true, createdAt: true, deletedAt: true,
            },
        });

        const storageByUser = await prisma.file.groupBy({
            by: ["ownerId"],
            where: { deletedAt: null },
            _sum: { size: true },
        });
        const storageMap = new Map(storageByUser.map((s) => [s.ownerId, s._sum.size || 0]));

        res.json({
            users: users.map((u) => ({ ...u, storageUsedBytes: storageMap.get(u.id) || 0 })),
        });
    } catch (err) {
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}

export const statsController = async (req: Request, res: Response) => {
    try {
        const [userCount, fileCount, totalStorage] = await Promise.all([
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.file.count({ where: { deletedAt: null } }),
            prisma.file.aggregate({ where: { deletedAt: null }, _sum: { size: true } }),
        ]);

        res.json({ userCount, fileCount, totalStorageBytes: totalStorage._sum.size || 0 });
    } catch (err) {
        return res.status(500).json({
            error: 'Internal Server Error'
        });
    }
};

export const userroleController = async (req: Request, res: Response) => {
    try {
        const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { role } = req.body;
        if (!["USER", "ADMIN"].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }
        if (userId === req.user!.userId && role !== "ADMIN") {
            return res.status(400).json({ error: "Cannot change your own role" }); // prevents locking yourself out
        }

        const user = await prisma.user.update({ where: { id: userId }, data: { role } });
        res.json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
};

export const userssuspendController = async (req: Request, res: Response) => {
    try {
        const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { suspended } = req.body;
        if (userId === req.user!.userId) {
            return res.status(400).json({ error: "Cannot suspend your own account" });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { suspended: !!suspended },
        });
        res.json({ user: { id: user.id, email: user.email, suspended: user.suspended } });
    } catch (err) {
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
};

export const deleteuserController = async (req: Request, res: Response) => {
    try {
        const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (userId === req.user!.userId) {
            return res.status(400).json({ error: "Cannot delete your own account via admin panel" });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const now = new Date();
        const rootFolders = await prisma.folder.findMany({
            where: { ownerId: user.id, parentFolderId: null, deletedAt: null },
        });
        for (const folder of rootFolders) {
            await softDeleteFolderRecursive(folder.id, user.id);
        }
        await prisma.file.updateMany({
            where: { ownerId: user.id, folderId: null, deletedAt: null },
            data: { deletedAt: now },
        });
        await prisma.shareLink.updateMany({
            where: { createdById: user.id, revokedAt: null },
            data: { revokedAt: now },
        });
        await prisma.user.update({ where: { id: user.id }, data: { deletedAt: now } });

        res.json({ message: "User deleted" });
    } catch(err) {
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
};
 