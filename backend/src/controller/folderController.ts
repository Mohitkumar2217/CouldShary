import type { Request, Response } from "express";
import { prisma } from "../db.js"; 

export const createFolderController = async (req: Request, res: Response) => {
    try {
        const { name, parentFolderId } = req.body;

        if (!name) {
            return res.status(400).json({
                error: "Folder name required"
            });
        }

        // If nesting under a parent , confirm the parent exists and belongs to thid user 
        if (parentFolderId) {
            const parent = await prisma.folder.findUnique({
                where: {
                    id: parentFolderId
                }
            });
            if (!parent || parent.deletedAt) {
                return res.status(404).json({
                    error: "Parent folder not found"
                });
            }
            if (parent.ownerId !== req.user!.userId) {
                return res.status(403).json({
                    error: "Forbidden"
                });
            }
        }
        const folder = await prisma.folder.create({
            data: {
                name,
                ownerId: req.user!.userId,
                parentFolderId: parentFolderId || null,
            }
        });


        return res.status(201).json({
            folder
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}


export const listContentController = async (req: Request, res: Response) => {
    try {
        const { folderId } = req.query;

        const [folders, files] = await Promise.all([
            prisma.folder.findMany({
                where: {
                    ownerId: req.user!.userId,
                    parentFolderId: (folderId as string) || null,
                    deletedAt: null,
                },
                orderBy: { name: "asc" },
            }),
            prisma.file.findMany({
                where: {
                    ownerId: req.user!.userId,
                    folderId: (folderId as string) || null,
                    deletedAt: null,
                },
                orderBy: { name: "asc" },
            }),
        ]);

        return res.status(200).json({
            folders,
            files
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}

export const breadcrumbController = async (req: Request, res: Response) => {
    try {
        const breadcrumbs: { id: string; name: string }[] = [];
        const id = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;

        let currentId: string | null = id;

        while (currentId) {
            const folder = await prisma.folder.findUnique({
                where: { id: currentId }
            }) as any;
            if (!folder || folder.ownerId !== req.user!.userId) break;
            breadcrumbs.unshift({
                id: folder.id,
                name: folder.name
            });
            currentId = folder.parentFolderId;
        }
        return res.status(200).json({
            breadcrumbs
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

export const renameController = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const id = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;

        const folder = await prisma.folder.findUnique({
            where: {
                id: id
            }
        });
        if (!folder || folder.deletedAt) {
            return res.status(404).json({
                error: "Folder not found"
            });
        }
        if (folder.ownerId !== req.user!.userId) {
            return res.status(403).json({
                error: "Forbidden"
            });
        }

        const updated = await prisma.folder.update({
            where: {
                id: id
            },
            data: { name },
        });

        res.status(201).json({
            folder: updated,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error",
        });
    }
}


export const moveFolderController = async (req: Request, res: Response) => {
    try {
        const { newParentFolderId } = req.body; // null = move  to root
        const folderId = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;

        const folder = await prisma.folder.findUnique({
            where: {
                id: folderId,
            }
        });
        if (!folder || folder.deletedAt) {
            return res.status(404).json({
                error: "Folder not found"
            });
        }
        if (folder.ownerId !== req.user!.userId) {
            return res.status(403).json({
                error: "Forbidden"
            });
        }

        // prevent moving a folder int o itself or one of its own descendants
        if (newParentFolderId) {
            if (newParentFolderId === folderId) {
                return res.status(400).json({
                    error: "Cannot move a folder into itself"
                });
            }

            let currentId: string | null = newParentFolderId;
            while (currentId) {
                if (currentId === folderId) {
                    return res.status(400).json({
                        error: "Cannot move a folder into its own decendants"
                    });
                }
                const current = await prisma.folder.findUnique({
                    where: {
                        id: currentId,
                    }
                });
                currentId = current?.parentFolderId ?? null;
            }

            const newParent = await prisma.folder.findUnique({
                where: {
                    id: newParentFolderId
                }
            });
            if (!newParent || newParent.ownerId !== req.user!.userId) {
                return res.status(403).json({
                    error: "Forbidden"
                });
            }
        }
        const updated = await prisma.folder.update({
            where: {
                id: folderId,
            },
            data: {
                parentFolderId: newParentFolderId || null
            },
        });

        return res.status(201).json({
            folder: updated
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error",
        });
    }

}


export const moveFileController = async (req: Request, res: Response) => {
    try {
        const { newFolderId } = req.body;
        const folderId = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;
        const file = await prisma.file.findUnique({
            where: {
                id: folderId
            }
        });

        if (!file || file.deletedAt) {
            return res.status(404).json({
                error: "File Not found"
            });
        }
        if (file.ownerId !== req.user!.userId) {
            return res.status(403).json({
                error: "Forbidden"
            });
        }

        if (newFolderId) {
            const folder = await prisma.folder.findUnique({
                where: { id: newFolderId }
            });
            if (!folder || folder.ownerId !== req.user!.userId) {
                return res.status(403).json({
                    error: "Forbidden"
                });
            }
        }

        const updated = await prisma.file.update({
            where: { id: folderId },
            data: { folderId: newFolderId || null },
        });

        return res.status(201).json({
            file: updated
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}


export const deleteFolderController = async (req: Request, res: Response) => {
    try {
        const folderId = Array.isArray(req.params.id)
            ? req.params.id[0] :
            req.params.id;
        const folder = await prisma.folder.findUnique({
            where: {
                id: folderId
            }
        });

        if(!folder || folder.deletedAt) {
            return res.status(404).json({
                error: "Folder not found"
            });
        }
        if(folder.ownerId !== req.user!.userId) {
            return res.status(403).json({
                error: "Forbidden"
            });
        }

        await softDeleteFolderRecursive(folderId, req.user!.userId);

        return res.status(200).json({
            message: "Folder deleted",
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}

export async function softDeleteFolderRecursive(folderId: string, userId: string) {
    const now = new Date();

    // soft-delete all direct child folders(recursivly)
    const children = await prisma.folder.findMany({
        where: {
            parentFolderId: folderId,
            ownerId: userId,
            deletedAt: null,
        }
    });
    for (const child of children) {
        await softDeleteFolderRecursive(child.id, userId);
    }

    // soft-delete all files directly in this folder
    await prisma.file.updateMany({
        where: {
            folderId,
            ownerId: userId,
            deletedAt: null,
        },
        data: {
            deletedAt: now,
        }
    });

    // soft-delete the folder itself
    // await prisma.folder.update({
    //     where: {
    //         id: folderId,
    //     },
    //     data: {
    //         deletedAt: null,
    //     }
    // });
    // soft-delete the folder itself
    await prisma.folder.delete({
        where: {
            id: folderId,
        }
    });
}