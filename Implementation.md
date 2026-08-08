# Implementation Reference

Technical deep-dive into how SecureShare is built — architecture, database schema, full API reference, background jobs, and key design decisions. Pairs with [`README.md`](./README.md), which covers setup and running the project.

---

## Architecture Overview

```
┌─────────────┐      HTTPS       ┌──────────────┐
│   Next.js   │ ───────────────► │   Express    │
│  (Vercel)   │ ◄─────────────── │   (Render)   │
└─────────────┘                  └──────┬───────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
             ┌─────────────┐     ┌─────────────┐      ┌──────────────┐
             │  PostgreSQL │     │    Redis     │      │   Supabase   │
             │   (Render)  │     │   (Render)   │      │   Storage    │
             └─────────────┘     └──────┬───────┘      └──────────────┘
                                         │
                                  ┌──────▼───────┐
                                  │   BullMQ     │
                                  │   Workers    │
                                  │ (email, cleanup, thumbnails) │
                                  └──────────────┘
```

- **Frontend and backend are fully decoupled** — the frontend only ever talks to the backend's REST API (`apiFetch` for authenticated routes, plain `fetch` for public ones like the share-link page and pre-login auth routes).
- **File bytes never pass through the backend** for downloads — the backend issues short-lived signed URLs (5 min) directly to Supabase Storage. Uploads under ~50MB go through the backend via `multer`; larger files use a custom chunked-upload protocol (see below) since Supabase's client SDK doesn't expose S3-style native multipart upload.
- **Background work is queued, never synchronous** — emails, thumbnail generation, and cleanup jobs all run via BullMQ workers backed by Redis, so a slow email provider or image resize never blocks a user-facing request.

---

## Database Schema (Prisma)

### `User`
| Field | Type | Notes |
|---|---|---|
| id | String (uuid) | |
| email | String | unique |
| passwordHash | String | bcrypt, 12 rounds |
| name | String? | |
| role | Role enum | `USER` \| `ADMIN` |
| verified | Boolean | must be true to log in |
| suspended | Boolean | blocks login without deleting data |
| emailVerificationTokenHash | String? | SHA-256, unique |
| emailVerificationExpiresAt | DateTime? | 24h from issue |
| resetPasswordTokenHash | String? | SHA-256, unique |
| resetPasswordExpiresAt | DateTime? | 1h from issue |
| deletedAt | DateTime? | soft delete |

### `Folder`
Self-referencing via `parentFolderId` for nesting. `ownerId` + soft-delete (`deletedAt`) like every other resource.

### `File`
| Field | Notes |
|---|---|
| storageKey | Path inside the Supabase bucket — the DB never stores file bytes |
| contentHash | SHA-256 of file content, used for per-user deduplication |
| thumbnailKey | Set once the thumbnail worker finishes (images only) |
| folderId | Nullable — null means root level |

### `ShareLink`
| Field | Notes |
|---|---|
| token | Public-facing identifier (nanoid, 12 chars) — separate from `id` |
| visibility | `PUBLIC` \| `PRIVATE` |
| passwordHash | bcrypt, nullable |
| expiresAt, maxDownloads, downloadCount | Enforced on every access, not just at creation |
| revokedAt | Soft-revoke, preserves audit history |

### `FileAccessGrant`
Powers "share with specific people" — `fileId` + `userId` + `permission` (`VIEW`/`DOWNLOAD`/`EDIT`), separate from `ShareLink`.

### `AuditLog`
Present in schema for future use; not actively written to by current routes.

**Design principle used throughout**: every deletable resource uses soft-delete (`deletedAt`/`revokedAt`), never hard `DELETE`. This gives every destructive action an undo window and lets background jobs handle actual purging on a schedule.

---

## API Reference

### Auth (`/auth`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | — | Creates unverified account, sends verification email, does NOT log in |
| POST | `/login` | — | Blocks unverified (`403 unverified: true`) and suspended (`403`) accounts |
| POST | `/refresh` | cookie | Reads httpOnly refresh cookie, issues new access token, rotates refresh token |
| POST | `/verify-email` | — | Consumes a SHA-256-hashed token |
| POST | `/resend-verification` | — | Rate-limited, generic response (anti-enumeration) |
| POST | `/forgot-password` | — | Rate-limited, generic response |
| POST | `/reset-password` | — | Consumes token, updates password |
| DELETE | `/account` | JWT + password | Cascading soft-delete of all owned resources |

### Files (`/files`)
| Method | Path | Notes |
|---|---|---|
| POST | `/upload` | Basic upload (≤50MB), dedup check before storage write |
| POST | `/upload/init` | Chunked upload session start |
| POST | `/upload/chunk/:uploadId` | One chunk, appended to a temp file |
| GET | `/upload/status/:uploadId` | For client-side resume after refresh |
| POST | `/upload/complete/:uploadId` | Dedup check (hash computed before deciding to upload), streams to Supabase |
| GET | `/:id/download` | Ownership OR FileAccessGrant required; returns signed URL |
| GET | `/:id/thumbnail` | Signed URL to generated thumbnail, 404 if not ready/not an image |
| DELETE | `/:id` | Soft-delete, also revokes active share links for the file |

### Folders (`/folders`)
| Method | Path | Notes |
|---|---|---|
| POST | `/` | Create, optional `parentFolderId` |
| GET | `/?folderId=` | List contents; omit param for root |
| GET | `/:id/breadcrumbs` | Root-to-folder path |
| PATCH | `/:id` | Rename |
| PATCH | `/:id/move` | Move; blocks self-move and move-into-own-descendant |
| PATCH | `/files/:id/move` | Move a file into a different folder |
| DELETE | `/:id` | Recursive soft-delete of all nested folders/files |

### Sharing (`/`, `/files/:fileId/share`, `/share`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/files/:fileId/share` | Owner | Create link, optional password/expiry/maxDownloads |
| GET | `/files/:fileId/share` | Owner | List a file's active links |
| GET | `/share-links` | Any user | ALL of your links across every file, paginated, with computed status |
| GET | `/share/:token` | — | Public metadata (`requiresPassword`, `visibility`) |
| POST | `/share/:token/download` | — | Password-rate-limited; returns signed URL |
| DELETE | `/share/:id` | Creator | Revoke |

### File Access Grants (`/files/:fileId/access`)
| Method | Path | Notes |
|---|---|---|
| POST | `/` | Grant a user access by email + permission |
| GET | `/` | List grants (owner only) |
| DELETE | `/:userId` | Revoke |

### Admin (`/admin`) — all routes require `role: ADMIN`
| Method | Path | Notes |
|---|---|---|
| GET | `/users` | All users + computed storage usage |
| GET | `/stats` | Platform-wide counts |
| PATCH | `/users/:id/role` | Promote/demote; self-demotion blocked |
| PATCH | `/users/:id/suspend` | Toggle; self-suspension blocked |
| DELETE | `/users/:id` | Force cascading delete; self-deletion via this route blocked |

### Users (`/users`)
| Method | Path | Notes |
|---|---|---|
| GET | `/me/storage` | Current user's total storage used |

---

## Background Jobs (BullMQ)

| Job | Queue | Schedule | Purpose |
|---|---|---|---|
| `deactivate-expired-links` | cleanup | Every 15 min | Sets `revokedAt` on expired share links |
| `purge-soft-deleted-files` | cleanup | Daily | Permanently removes files soft-deleted 30+ days ago |
| `send-expiry-reminders` | cleanup | Hourly | Emails link creators when a link expires within 24h |
| `generate-thumbnail` | thumbnail | On image upload | Downloads original, resizes with `sharp`, uploads under `thumbnails/` prefix |
| `send-email` | email | On enqueue | All transactional email (verification, reset, share notifications, reminders) |

Monitor all queues live at `/admin/queues` (Bull Board — protected by `requireAuth` + `requireRole("ADMIN")`).

---

## Key Design Decisions

- **Chunked upload architecture**: since Supabase Storage doesn't expose S3-style multipart upload, large files are chunked client-side, sent sequentially to the backend, appended to a server-side temp file, and streamed to Supabase as one object only once complete. Redis tracks per-session progress for resumability; the client independently tracks `fingerprint → uploadId` in IndexedDB so a page refresh can resume from the server's last known chunk count.
- **Reset/verification tokens use SHA-256, not bcrypt**: these tokens are already high-entropy random data (`crypto.randomBytes`), so a deterministic hash for fast lookup is safe and necessary — bcrypt's per-hash salt would make lookup-by-token impossible without iterating every user.
- **`apiFetch` vs plain `fetch`**: `apiFetch` (with its 401-triggers-token-refresh logic) is reserved for genuinely authenticated routes. Public routes — the share-link page, login, register, forgot-password — use plain `fetch`, because some of those routes use `401` for their own unrelated meaning (e.g., "wrong share-link password"), which would otherwise collide with the refresh-token logic and produce confusing behavior.
- **Ownership checked on every single route**, not just at a middleware layer — every file/folder/share-link/access-grant operation explicitly compares the resource's owner ID against the authenticated user's ID before allowing read or write.
- **Content-hash deduplication**: computed *before* the storage upload decision (not after), so a duplicate upload reuses the existing `storageKey` and skips the Supabase write entirely.

---

## Known Limitations / Not Yet Built

- No per-user storage quota enforcement (usage is tracked and displayed, but not capped)
- No automated multi-user isolation test suite (manually verified)
- No production error monitoring (Sentry or equivalent) wired in
- No Terms of Service / Privacy Policy pages
- Search, sort, and pagination for the file/folder list are not implemented (only share-links list is paginated)
- Demo account has no automatic periodic reset job

---

## Deployment Notes

- **Frontend (Vercel)**: Root Directory set to `frontend`; `NEXT_PUBLIC_API_BASE_URL` env var points at the deployed backend.
- **Backend (Render)**: deployed as a native Node service (not Docker); Build Command is `npm install && npm run build` (compiles TypeScript via `tsc`); Pre-Deploy Command is `npx prisma migrate deploy`; `postinstall` script runs `prisma generate` automatically. Binds to `0.0.0.0` and Render's assigned `PORT` env var, not a hardcoded port.
- **Redis**: Render's "Key Value" offering (Redis-compatible, renamed from "Redis" in their dashboard).
- **CORS**: backend's `FRONTEND_URL` must exactly match the live Vercel URL, or every cross-origin request from the frontend gets blocked.