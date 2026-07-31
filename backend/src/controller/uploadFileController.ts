import type { Request, Response } from "express"; 
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "../db.js";
import { supabaseAdmin } from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";


export const uploadFileController = async (req: Request, res: Response) => {
    try {
        if(!req.file) {
            return res.status(400).json({
                error: "No file provided",
            });
        }
        const { originalname, mimetype, size, buffer} = req.file;
        const { folderId} = req.body;  // optional - null means root

        // Namespace the storage key by user + a random suffix to avoid collisions
        const ext = path.extname(originalname)
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal sever error"
        });
    }
}