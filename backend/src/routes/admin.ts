import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { softDeleteFolderRecursive } from "../controller/folderController.js";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get("/users", async (req, res) => {
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
});

router.get("/stats", async (req, res) => {
    const [userCount, fileCount, totalStorage] = await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.file.count({ where: { deletedAt: null } }),
        prisma.file.aggregate({ where: { deletedAt: null }, _sum: { size: true } }),
    ]);

    res.json({ userCount, fileCount, totalStorageBytes: totalStorage._sum.size || 0 });
});

router.patch("/users/:id/role", async (req, res) => {
    const { role } = req.body;
    if (!["USER", "ADMIN"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
    }
    if (req.params.id === req.user!.userId && role !== "ADMIN") {
        return res.status(400).json({ error: "Cannot change your own role" }); // prevents locking yourself out
    }

    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
    res.json({ user: { id: user.id, email: user.email, role: user.role } });
});

router.patch("/users/:id/suspend", async (req, res) => {
    const { suspended } = req.body;
    if (req.params.id === req.user!.userId) {
        return res.status(400).json({ error: "Cannot suspend your own account" });
    }

    const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { suspended: !!suspended },
    });
    res.json({ user: { id: user.id, email: user.email, suspended: user.suspended } });
});

router.delete("/users/:id", async (req, res) => {
    if (req.params.id === req.user!.userId) {
        return res.status(400).json({ error: "Cannot delete your own account via admin panel" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
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
});

export default router;