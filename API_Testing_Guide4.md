# API Testing Guide — Phases 8–9 (Background Jobs & Email)

Builds on the earlier guides. You'll need:
- A valid `ACCESS_TOKEN`
- A `FILE_ID` from an existing upload
- Server running with workers started (`npm run dev` in `backend/`)

**Important:** for email tests, only send to your own Resend account email (`systemfirst307@gmail.com` per the sandbox restriction) until a domain is verified.

```bash
export ACCESS_TOKEN="your-token-here"
export FILE_ID="your-file-id-here"
```

---

## Phase 8 — Background Jobs & Queues

### 1. Confirm workers + scheduler started

Check your server console on startup for:
```
[queues] Repeatable jobs scheduled
```

If missing, workers/scheduler aren't wired into `index.ts` correctly — check the imports.

### 2. Bull Board dashboard

Visit in a browser:
```
http://localhost:4000/admin/queues
```
**Expected:** three queues listed — `email`, `cleanup`, `thumbnail` — each with tabs for waiting/active/completed/failed jobs.

### 3. Thumbnail job triggers on image upload

Upload an image file (jpg/png) via `/files/upload`:
```bash
curl -X POST http://localhost:4000/files/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@/path/to/test-image.jpg"
```
**Expected:** console logs `[thumbnail] Would generate thumbnail for file ...`, and Bull Board's `thumbnail` queue shows a completed job.

Upload a non-image (e.g. a `.txt` file) — **expected:** no thumbnail job log (the worker returns early for non-image mimetypes).

### 4. Manually trigger the expired-link cleanup job (don't wait 15 min)

You'll need a small script or a temporary route to enqueue a job directly. Easiest: add a temporary test route.

`backend/src/routes/debug.ts` (delete this file before deploying — dev only):
```typescript
import { Router } from "express";
import { cleanupQueue } from "../queues";

const router = Router();

router.post("/trigger-cleanup", async (req, res) => {
  await cleanupQueue.add("deactivate-expired-links", {});
  res.json({ message: "Cleanup job triggered" });
});

export default router;
```
Wire it in temporarily: `app.use("/debug", debugRoutes);`

```bash
curl -X POST http://localhost:4000/debug/trigger-cleanup
```

**Setup first:** create a share link with `expiresAt` in the past (see Phase 7 testing guide, section 5), note its `id`, then trigger cleanup and check via Prisma Studio that its `revokedAt` is now set.

### 5. Test job failure handling

Temporarily break something the cleanup job depends on (e.g. stop your Postgres container: `docker stop filesharing_postgres`), then trigger the cleanup job again.

**Expected:** Bull Board shows the job as **failed**, console logs the error via the `.on("failed", ...)` handler, and — critically — your server **does not crash**.

Restart Postgres afterward: `docker start filesharing_postgres`.

### 6. Restart resilience

While a job is queued (not yet processed), kill your `npm run dev` process (Ctrl+C), then restart it.

**Expected:** the job is still in the queue (check Bull Board) and gets processed once the worker reconnects — BullMQ persists queue state in Redis, not in your Node process memory.

---

## Phase 9 — Email

### 1. Registration triggers a verification email

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"systemfirst307@gmail.com","password":"SuperSecret123!","name":"Test User"}'
```

**Expected:**
- API responds normally (201) regardless of email outcome (email is queued, not synchronous)
- Within a few seconds, check your inbox — a "Verify your email" email arrives
- Bull Board's `email` queue shows a completed job
- Email renders correctly: heading, button, no broken HTML

### 2. Share notification email

```bash
curl -X POST http://localhost:4000/files/$FILE_ID/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"visibility":"PUBLIC","recipientEmail":"systemfirst307@gmail.com"}'
```

**Expected:** "A file was shared with you" email arrives, with a working link to the share page.

### 3. Expiry reminder email (manual trigger)

First, create a share link expiring in ~12 hours:
```bash
EXPIRES=$(date -u -d "+12 hours" +"%Y-%m-%dT%H:%M:%S.000Z")  # Linux/Mac
curl -X POST http://localhost:4000/files/$FILE_ID/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"visibility\":\"PUBLIC\",\"expiresAt\":\"$EXPIRES\"}"
```
(On Windows/PowerShell: `Get-Date (Get-Date).AddHours(12) -Format "yyyy-MM-ddTHH:mm:ss.000Z"`)

Then trigger the reminder job manually (using the same debug route pattern as Phase 8, section 4, but enqueueing `"send-expiry-reminders"` instead):
```bash
curl -X POST http://localhost:4000/debug/trigger-expiry-reminders
```

**Expected:** email arrives with subject "Your share link for ... expires soon" and a roughly correct "expires in about X hours" line.

### 4. Failure handling: broken API key

Temporarily set an invalid `RESEND_API_KEY` in `.env`, restart the server, then register a new test user.

**Expected:** Bull Board shows the email job as **failed** with the Resend error message visible in the job details; your registration API call itself still returns `201` successfully (proving email failure doesn't block the actual user-facing action).

Restore the correct API key afterward.

### 5. Sandbox restriction check

Try sending to an email address that is NOT your Resend account's own address:
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"someone-else@example.com","password":"SuperSecret123!"}'
```

**Expected:** registration still succeeds (201), but the queued email job fails with the `403 validation_error` about testing-mode restrictions — confirms this is a sandbox limitation, not a bug in your code, until a domain is verified.

---

## Quick Reference Table

| Test | How | Expected Result |
|---|---|---|
| Workers + scheduler start | Check server console | `[queues] Repeatable jobs scheduled` |
| Bull Board loads | Visit `/admin/queues` | 3 queues listed |
| Thumbnail job (image) | Upload a .jpg/.png | Job logged + completed in Bull Board |
| Thumbnail job (non-image) | Upload a .txt | No thumbnail job created |
| Manual cleanup trigger | POST `/debug/trigger-cleanup` | Expired link's `revokedAt` set |
| Job failure handling | Stop Postgres, trigger job | Job fails in Bull Board, server stays up |
| Restart resilience | Kill + restart server mid-job | Job persists in Redis, resumes processing |
| Registration email | POST `/auth/register` | Verification email arrives |
| Share notification email | POST `/files/:id/share` with recipientEmail | Notification email arrives |
| Expiry reminder email | Manual trigger + link expiring in ~12h | Reminder email arrives with correct hours |
| Broken Resend key | Invalid `RESEND_API_KEY`, register | Registration succeeds (201), email job fails |
| Sandbox restriction | Register with a different email | Registration succeeds, email job fails with 403 |

**Remember to delete `backend/src/routes/debug.ts`** (and its `app.use` wiring) before any real deployment — it exists purely to manually trigger scheduled jobs during testing.