// apps/api/src/utils/token.ts
import { nanoid } from "nanoid";

export function generateShareToken() {
  return nanoid(12); // e.g. "V1StGXR8_Z5j" — random, URL-safe, unguessable
}