import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export function hasPassword(plain: string) {
    return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
}