import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import type { JwtPayLoad } from "../utils/jwt.js";

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayLoad;
        }
    }
}

export function requireAuth(req : Request, res: Response, next: NextFunction) {
    const authHeader  = req.headers.authorization;
    if(!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "no token provided"});
    }

    const token = authHeader.split(" ")[1];
    try {
        req.user = verifyAccessToken(token);
        next();
    } catch {
        return res.status(401).json({error: "Invalid or expired token"});
    }
}


export function requireRole(role: "USER" | "ADMIN") {
    return (req: Request, res: Response, next: NextFunction) => {
        if(req.user?.role !== role) {
            return res.status(403).json({error: "Forbidden"});
        }
        next();
    };
}