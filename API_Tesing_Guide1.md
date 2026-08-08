# API Testing Guide — Phases 1–3

Covers testing your Express API endpoints so far: health check, Supabase upload, and auth (register/login/me). Two options are given for each test — **curl** (works everywhere, no install) and **Postman/Thunder Client** (better for repeated testing, saves requests).

Make sure your API is running first:
```bash
cd apps/api
npm run dev
```
Should print something like `API running on port 4000`.

---

## 1. Health Check

**Purpose:** confirm the server is up before testing anything else.

**curl:**
```bash
curl http://localhost:4000/health
```
**Expected response:**
```json
{"status":"ok"}
```

---

## 2. Register a New User

**Purpose:** verify account creation, password hashing, and token issuance.

**curl:**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"SuperSecret123!","name":"Test User"}'
```

`-c cookies.txt` saves the returned `refreshToken` cookie to a file so you can reuse it in later requests.

**Expected response (201 Created):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "some-uuid",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

**Save the `accessToken` value** — you'll need it for every protected route below. Easiest way locally:
```bash
export ACCESS_TOKEN="paste-the-token-here"
```

### Test the duplicate-email case
Run the exact same curl command again.

**Expected response (409 Conflict):**
```json
{"error":"Email already in use"}
```

### Test missing fields
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"missing-password@example.com"}'
```
**Expected response (400 Bad Request):**
```json
{"error":"Email and password required"}
```

---

## 3. Login

**Purpose:** verify credential checking and token issuance for an existing user.

**curl (correct password):**
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"SuperSecret123!"}'
```
**Expected response (200 OK):** same shape as register — `accessToken` + `user`.

**curl (wrong password):**
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"WrongPassword"}'
```
**Expected response (401 Unauthorized):**
```json
{"error":"Invalid email or password"}
```

---

## 4. Protected Route (`/me`)

**Purpose:** verify the `requireAuth` middleware correctly validates tokens.

**curl (valid token):**
```bash
curl http://localhost:4000/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```
**Expected response (200 OK):**
```json
{"user":{"userId":"some-uuid","role":"USER"}}
```

**curl (no token):**
```bash
curl http://localhost:4000/me
```
**Expected response (401 Unauthorized):**
```json
{"error":"No token provided"}
```

**curl (garbage token):**
```bash
curl http://localhost:4000/me \
  -H "Authorization: Bearer not-a-real-token"
```
**Expected response (401 Unauthorized):**
```json
{"error":"Invalid or expired token"}
```

---

## 5. Rate Limiting on Login

**Purpose:** confirm brute-force protection works.

```bash
for i in {1..12}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"WrongPassword"}'
done
```

**Expected:** the first ~10 requests return `401`, and requests after that return `429` (or whatever status `express-rate-limit` is configured to send) with the message `"Too many attempts, try again later."`

---

## 6. Refresh Token Cookie Check

**Purpose:** confirm the refresh token is httpOnly (can't be stolen via XSS/JS).

Open `cookies.txt` (created by the `-c` flag earlier) in a text editor — you should see a line with `refreshToken` and a long JWT value. This confirms the cookie was set.

To confirm it's httpOnly specifically, use a browser instead of curl:
1. Hit `/auth/login` from your frontend (or Postman with "send cookies" enabled) so the browser actually stores the cookie
2. Open DevTools → Application tab → Cookies → `localhost:4000`
3. Confirm the `HttpOnly` column shows a checkmark for `refreshToken`
4. In the DevTools Console, run `document.cookie` — the refresh token should **not** appear in the output (only non-httpOnly cookies show up there)

---

## 7. Supabase Upload Script (from Phase 1)

**Purpose:** re-confirm storage still works after adding auth (unrelated systems, but good to re-check after touching `.env`).

```bash
npx ts-node src/scripts/test-upload.ts
```
**Expected:** console prints `Upload succeeded:` with a `data` object, and `test.txt` is visible in the Supabase dashboard's Storage tab.

---

## Postman / Thunder Client Setup (alternative to curl)

If you'd rather click buttons than type curl commands:

1. Create a new collection called `File Sharing API`
2. Add requests for each endpoint above (`GET /health`, `POST /auth/register`, `POST /auth/login`, `GET /me`)
3. For `/me`, set the `Authorization` header type to **Bearer Token** and paste your saved `accessToken`
4. In Postman, enable **"Automatically follow redirects"** and make sure cookie jar is on (Postman does this by default) so the refresh token cookie persists between requests in the same collection
5. Save example responses on each request (Postman lets you do this) so you have a reference for what "correct" looks like next time you break something

---

## Quick Reference Table

| Test | Method | Endpoint | Expected Status |
|---|---|---|---|
| Health check | GET | `/health` | 200 |
| Register new user | POST | `/auth/register` | 201 |
| Register duplicate email | POST | `/auth/register` | 409 |
| Register missing fields | POST | `/auth/register` | 400 |
| Login correct password | POST | `/auth/login` | 200 |
| Login wrong password | POST | `/auth/login` | 401 |
| `/me` valid token | GET | `/me` | 200 |
| `/me` no token | GET | `/me` | 401 |
| `/me` garbage token | GET | `/me` | 401 |
| Login spam (11th+ attempt) | POST | `/auth/login` | 429 |

Run through this whole guide top to bottom any time you want to confirm nothing broke after adding a new phase's code — it's a good regression check as the API grows.