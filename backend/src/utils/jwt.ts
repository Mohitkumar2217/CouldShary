import jwt from "jsonwebtoken";

export interface JwtPayLoad {
    userId : string;
    role: "USER" | "ADMIN";
}

export function signAccessToken(payload: JwtPayLoad) {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN as any,
    });
}

export function signRefreshToken(payload: JwtPayLoad) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as any,
    });
}


export function verifyAccessToken(token: string): JwtPayLoad {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayLoad;
}

export function verifyRefreshToken(token: string): JwtPayLoad {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayLoad;
}