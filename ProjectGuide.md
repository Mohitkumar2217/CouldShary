# Secure Cloud File Sharing Platform — Build Guide

A phase-by-phase roadmap. Each phase has a goal, what to build, key decisions, and a "you'll know it works when" checkpoint. Build and test each phase before moving to the next — this stack has a lot of moving parts, and debugging three broken things at once is miserable.

**Recommended dev setup:** everything runs locally via Docker — Postgres, Redis, and MinIO (S3-compatible storage). You write real AWS SDK code against MinIO, then swap one `.env` value to point at real S3 later. No AWS account needed until you deploy.

---

## Phase 0 — Project Skeleton & Tooling

**Goal:** a monorepo that runs, with linting and env management in place before any feature code exists.

- Decide: monorepo (`/apps/web`, `/apps/api`) vs two repos. Monorepo is easier to keep in sync for a solo/small-team build — recommend it, with a tool like `pnpm` workspaces (or Turborepo if you want caching).
- Scaffold `apps/web` with `create-next-app` (App Router, TypeScript, Tailwind).
- Scaffold `apps/api` as a plain Express + TypeScript app (`ts-node-dev` for hot reload).
- Add `shadcn/ui` to the web app (`npx shadcn@latest init`).
- Set up `.env` / `.env.example` in both apps from the start — you'll be adding vars constantly (DB URL, Redis URL, S3 endpoint/keys, Resend key, JWT secret).
- Add ESLint + Prettier shared config.

**Checkpoint:** Next.js dev server renders a shadcn Button on `localhost:3000`; Express server responds to `GET /health` on `localhost:4000`.

---

## Phase 1 — Infrastructure with Docker

**Goal:** one `docker-compose.yml` that brings up everything the backend depends on.

Services to define:
- `postgres` (official `postgres:16` image, persisted volume)
- `redis` (official `redis:7` image)
- `minio` (S3-compatible storage — exposes an S3 API + a web console; create a bucket like `files` on startup via `mc` or a small init script)

Key decisions:
- Use named volumes so data survives `docker compose down`.
- Put connection strings in `.env` at the repo root, referenced by both `docker-compose.yml` and your apps.
- MinIO's S3 endpoint (e.g. `http://localhost:9000`) plus a dummy access key/secret is all the AWS SDK needs — the SDK doesn't know or care it's not real AWS.

**Checkpoint:** `docker compose up`, then `psql`, `redis-cli ping`, and the MinIO console at `localhost:9001` all work. You can manually upload a test file through the MinIO console.

---

## Phase 2 — Database Design (Prisma)

**Goal:** a schema that supports everything in the feature list, migrated and seeded.

Core models to design (not exhaustive — refine as you go):
- `User` — id, email, hashed password, name, role (enum: `USER`, `ADMIN`), timestamps
- `Session` or rely on JWT (see Phase 3)
- `Folder` — id, name, ownerId, parentFolderId (self-relation for nesting)
- `File` — id, name, size, mimeType, storageKey (the S3 object key), ownerId, folderId (nullable = root), timestamps
- `ShareLink` — id, fileId (or folderId), token (unique, random), visibility (`PUBLIC`/`PRIVATE`), passwordHash (nullable), expiresAt (nullable), maxDownloads (nullable), downloadCount, createdById
- `FileAccessGrant` (optional, for private RBAC-style sharing to specific users) — fileId, userId, permission (`VIEW`/`DOWNLOAD`/`EDIT`)
- `AuditLog` (optional but nice to learn from) — action, userId, targetId, timestamp

Key decisions:
- Store only the **storage key**, never the actual file, in Postgres. The bytes live in S3/MinIO.
- Share link tokens: use a cryptographically random string (e.g. `nanoid` or `crypto.randomBytes`), not a sequential ID — this is the difference between a real product and a security hole.
- Password-protect a share link by hashing the password with bcrypt/argon2, same as user passwords — never store it plain.
- Soft-delete (`deletedAt` nullable) vs hard delete — soft delete is safer and easier to undo, worth it for a file platform.

**Checkpoint:** `prisma migrate dev` runs clean; Prisma Studio shows all tables; you can create a user + file + share link by hand through Prisma Studio.

---

## Phase 3 — Auth & Authorization

**Goal:** users can register, log in, and the API can tell who's making a request and what they're allowed to do.

- Password hashing with `bcrypt` (or `argon2`, slightly stronger).
- JWT-based auth: short-lived access token + longer-lived refresh token, refresh token stored in an httpOnly cookie.
- Express middleware that verifies the JWT and attaches `req.user`.
- RBAC: a simple `requireRole('ADMIN')` middleware, plus **ownership checks** on every file/folder route (a user's role doesn't matter if they're just not the owner — check `file.ownerId === req.user.id` or an explicit `FileAccessGrant` before allowing access).
- Rate-limit the login route (e.g. `express-rate-limit`) — auth endpoints are the #1 brute-force target.

**Checkpoint:** register → login → hit a protected route with the JWT → get a 200; hit it without a token or with someone else's file ID → get a 401/403.

---

## Phase 4 — Basic File Upload (Single Request)

**Goal:** upload a small file end-to-end through the real storage layer before adding complexity.

- Frontend: a drag-and-drop zone (build with plain HTML5 drag events + shadcn styling, or a lightweight lib like `react-dropzone`).
- Backend: `multer` (memory or disk storage) to receive the multipart upload, then stream it to S3/MinIO via the AWS SDK v3 (`@aws-sdk/client-s3`, `PutObjectCommand`).
- Save the resulting metadata (`storageKey`, size, mimeType, ownerId) to Postgres via Prisma only after the S3 upload succeeds.
- Generate presigned URLs (`GetObjectCommand` + `getSignedUrl`) for downloads instead of proxying file bytes through your API when possible — cheaper and scales better.

**Checkpoint:** drag a file into the browser, see it appear in MinIO's console, see a row in the `File` table, and can download it back via a presigned URL.

---

## Phase 5 — Large File / Chunked Uploads

**Goal:** uploads that don't die on a flaky connection or hit body-size limits.

- Switch to S3 **multipart upload**: `CreateMultipartUploadCommand` → client uploads chunks (e.g. 5–10MB each) directly to presigned per-part URLs → `CompleteMultipartUploadCommand` once all parts land.
- This means the file bytes go **browser → S3 directly**, not browser → your API → S3. Your API's job becomes: issue presigned part URLs, track progress, and finalize.
- Frontend: chunk the file with the native `File.slice()` API, upload chunks with retry logic, show per-chunk progress (sum into an overall progress bar).
- Handle resumability: store upload state (uploadId, completed part numbers) somewhere the client can recover from (e.g. IndexedDB or a "resume" endpoint backed by Redis) so a refresh doesn't restart a 2GB upload from zero.

**Checkpoint:** upload a multi-GB file, kill the network mid-upload, resume, and it completes without re-uploading finished chunks.

---

## Phase 6 — Folder Management

**Goal:** organize files hierarchically.

- CRUD for folders, respecting the self-relation (`parentFolderId`).
- Moving files/folders between folders — watch for the "moving a folder into its own descendant" bug (walk the parent chain before allowing the move).
- Recursive delete (or block delete-if-not-empty, your choice) with the ownership checks from Phase 3 applied at every level.
- Frontend: a tree or breadcrumb view; this is a good place to learn optimistic UI updates (move a file in the UI immediately, roll back if the API call fails).

**Checkpoint:** create nested folders, move a file three levels deep, delete a folder with contents, and permissions are still enforced at every level.

---

## Phase 7 — Share Links (Public/Private, Password, Expiration)

**Goal:** the platform's signature feature.

- Generate a `ShareLink` with a random token; the public URL is something like `/share/:token`.
- **Public** links: anyone with the URL can view/download (still enforce `expiresAt` and `maxDownloads`).
- **Private** links: require the visitor to be logged in and to have an explicit `FileAccessGrant`, or require the password check below even if "private" just means "not indexed/guessable."
- **Password-protected**: visiting `/share/:token` shows a password form first; verify against `passwordHash` server-side (never expose the hash, and don't leak "wrong password" vs "expired" in a way that helps enumeration).
- **Expiration**: check `expiresAt` on every access; also run a background job (Phase 8) to periodically clean up/deactivate expired links rather than relying only on request-time checks.
- Rate-limit password attempts per token to prevent brute-forcing a share password.

**Checkpoint:** create a public link (works with no login), a password link (blocks until correct password), and an expired link (returns 410 Gone, not the file).

---

## Phase 8 — Background Jobs & Queues (BullMQ + Redis)

**Goal:** move slow/scheduled work off the request path.

Good candidates for queued jobs:
- Sending emails (share notifications, "your link expires soon")
- Deactivating expired share links on a schedule (repeatable job, e.g. every 15 min)
- Generating thumbnails/previews for images or PDFs after upload
- Virus/malware scanning of uploaded files (even a stubbed check is worth building the pipeline for)
- Cleaning up orphaned S3 objects (uploads that started but were never finalized)

Set up BullMQ with a queue + worker process (can run in the same Express process for dev, separate process in production). Use Redis as the backing store (already in Docker Compose from Phase 1).

**Checkpoint:** uploading a file enqueues a thumbnail job; you can watch it process in a BullMQ dashboard (e.g. `bull-board`); killing the worker and restarting it resumes pending jobs instead of losing them.

---

## Phase 9 — Email Integration (Resend)

**Goal:** transactional email that doesn't feel bolted on.

- Account verification / password reset emails.
- "Someone shared a file with you" notifications.
- "Your share link expires in 24 hours" reminders (driven by the Phase 8 scheduler).
- Build 2–3 simple React Email or plain HTML templates; send through the background queue, not synchronously in the request handler (an email provider hiccup shouldn't fail a file upload).

**Checkpoint:** register a real email, receive a verification email, click through, and it lands from the queue rather than blocking the register response.

---

## Phase 10 — Frontend Build-Out

**Goal:** tie all the backend features into a coherent UI.

Rough page/component list:
- Auth pages (login/register/forgot-password)
- Dashboard: file/folder grid or list, drag-and-drop upload zone, upload progress
- Folder navigation (breadcrumbs or sidebar tree)
- File detail panel: preview (image/PDF inline, generic icon otherwise), share button, delete, rename
- Share modal: toggle public/private, set password, set expiration, copy link
- Public share landing page (`/share/:token`) — works for logged-out visitors
- Admin view (if you build RBAC roles beyond owner-only) — user list, storage usage

Use shadcn/ui components (Dialog, DropdownMenu, Progress, Table) rather than hand-rolling — this is most of the "professional feel" for free.

**Checkpoint:** a new user can register, upload a file, organize it into a folder, share it with a password and expiration, and a separate incognito window can access it correctly.

---

## Phase 11 — Security Hardening Pass

Do this as a dedicated pass, not just "along the way":
- Confirm every file/folder/share route re-checks ownership/permission server-side (never trust a client-supplied ID alone).
- Confirm presigned URLs are short-lived (minutes, not hours) and scoped to a single object/action.
- Confirm uploads validate file type/size server-side, not just in the frontend dropzone.
- Confirm rate limiting exists on auth, password-guess, and upload endpoints.
- Confirm secrets (JWT secret, S3 keys, DB password) are only in `.env`/secret manager, never committed.
- Add basic security headers (helmet.js on Express) and CORS locked to your actual frontend origin.

**Checkpoint:** you can articulate, for every route, "what stops User B from acting on User A's file by just changing an ID in the request."

---

## Phase 12 — Deployment (when ready)

- Swap MinIO env vars for real AWS S3 credentials/endpoint — code doesn't change if you used the standard AWS SDK.
- Swap local Postgres/Redis for managed instances (RDS/Supabase, Upstash/ElastiCache, etc.) or keep them in containers on your host.
- Containerize both apps (`Dockerfile` for web, `Dockerfile` for api) and reuse the same `docker-compose.yml` pattern, or move to your platform of choice (Railway, Fly.io, ECS, etc.).
- Set up a real domain + HTTPS before exposing password-protected share links publicly (passwords over plain HTTP defeat the purpose).

---

## Suggested Build Order Summary

0. Skeleton → 1. Docker infra → 2. DB schema → 3. Auth/RBAC → 4. Basic upload → 5. Chunked upload → 6. Folders → 7. Share links → 8. Background jobs → 9. Email → 10. Frontend polish → 11. Security pass → 12. Deploy

Each phase is independently testable — don't move on until the checkpoint for that phase actually works. When you're ready to start coding, let me know which phase you want to build first and whether you want the DB schema, the Docker Compose file, or actual route/component code.