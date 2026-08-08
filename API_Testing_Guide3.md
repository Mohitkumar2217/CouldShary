# API Testing Guide — Phase 7 (Share Links)

Builds on the earlier guides (Phases 1–3, Phases 4–6). You'll need:
- A valid `ACCESS_TOKEN` (logged in)
- A `FILE_ID` for a file you already uploaded

```bash
export ACCESS_TOKEN="your-token-here"
export FILE_ID="your-file-id-here"
```

---

## 1. Create a public share link (no password, no expiration)

```bash
curl -X POST http://localhost:4000/files/$FILE_ID/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"visibility":"PUBLIC"}'
```

**Expected (201):**
```json
{
  "shareLink": {
    "id": "...",
    "token": "abc123XYZ",
    "url": "http://localhost:3000/share/abc123XYZ",
    "visibility": "PUBLIC",
    "expiresAt": null,
    "maxDownloads": null,
    "downloadCount": 0
  }
}
```

Save the token:
```bash
export SHARE_TOKEN="abc123XYZ"
```

**Verify:** `passwordHash` should NOT appear anywhere in the response.

---

## 2. Access the public link (no auth needed)

```bash
curl http://localhost:4000/share/$SHARE_TOKEN
```

**Expected (200):**
```json
{"file":{"name":"...","size":...,"mimeType":"..."},"requiresPassword":false,"visibility":"PUBLIC"}
```

---

## 3. Download via the public link

```bash
curl -X POST http://localhost:4000/share/$SHARE_TOKEN/download \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected (200):**
```json
{"url":"https://...signed-url...","expiresIn":300}
```

Open that `url` in a browser — should download/display the file.

---

## 4. Create a password-protected link

```bash
curl -X POST http://localhost:4000/files/$FILE_ID/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"visibility":"PUBLIC","password":"mySecret123"}'
```

```bash
export PROTECTED_TOKEN="paste-the-new-token"
```

### 4a. Check metadata (should show requiresPassword: true)

```bash
curl http://localhost:4000/share/$PROTECTED_TOKEN
```
**Expected:** `"requiresPassword": true`

### 4b. Try downloading with no password

```bash
curl -X POST http://localhost:4000/share/$PROTECTED_TOKEN/download \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected (401):**
```json
{"error":"Incorrect password"}
```

### 4c. Try with wrong password

```bash
curl -X POST http://localhost:4000/share/$PROTECTED_TOKEN/download \
  -H "Content-Type: application/json" \
  -d '{"password":"wrongpassword"}'
```
**Expected (401):** same error message as 4b (no leak of which case it was).

### 4d. Try with correct password

```bash
curl -X POST http://localhost:4000/share/$PROTECTED_TOKEN/download \
  -H "Content-Type: application/json" \
  -d '{"password":"mySecret123"}'
```
**Expected (200):** signed URL returned.

---

## 5. Expired link

Create a link with `expiresAt` in the past:
```bash
curl -X POST http://localhost:4000/files/$FILE_ID/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"visibility":"PUBLIC","expiresAt":"2020-01-01T00:00:00.000Z"}'
```
```bash
export EXPIRED_TOKEN="paste-token"
```
```bash
curl http://localhost:4000/share/$EXPIRED_TOKEN
```
**Expected (410):**
```json
{"error":"This share link has expired"}
```

---

## 6. Max downloads reached

Create a link with `maxDownloads: 1`:
```bash
curl -X POST http://localhost:4000/files/$FILE_ID/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"visibility":"PUBLIC","maxDownloads":1}'
```
```bash
export LIMITED_TOKEN="paste-token"
```

Download once (should succeed):
```bash
curl -X POST http://localhost:4000/share/$LIMITED_TOKEN/download \
  -H "Content-Type: application/json" -d '{}'
```

Download again (should now fail):
```bash
curl -X POST http://localhost:4000/share/$LIMITED_TOKEN/download \
  -H "Content-Type: application/json" -d '{}'
```
**Expected (410) on the second attempt:**
```json
{"error":"This share link has reached its download limit"}
```

---

## 7. Revoke a share link

```bash
curl -X DELETE http://localhost:4000/share/<some-share-link-id> \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```
**Expected (200):** `{"message":"Share link revoked"}`

Then try accessing it:
```bash
curl http://localhost:4000/share/<the-revoked-token>
```
**Expected (404):**
```json
{"error":"Share link not found"}
```

---

## 8. Revoke someone else's share link (should fail)

Using a second user's token:
```bash
curl -X DELETE http://localhost:4000/share/<first-users-link-id> \
  -H "Authorization: Bearer $OTHER_USER_TOKEN"
```
**Expected (403):**
```json
{"error":"Forbidden"}
```

---

## 9. Rate limiting on password attempts

```bash
for i in {1..12}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/share/$PROTECTED_TOKEN/download \
    -H "Content-Type: application/json" \
    -d '{"password":"wrongpassword"}'
done
```
**Expected:** first ~10 requests return `401`, requests after that return `429`.

---

## 10. List all share links for a file (owner only)

```bash
curl http://localhost:4000/files/$FILE_ID/share \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```
**Expected (200):** array of active (non-revoked) share links for that file, with `passwordHash` omitted from each.

Test as a different user:
```bash
curl http://localhost:4000/files/$FILE_ID/share \
  -H "Authorization: Bearer $OTHER_USER_TOKEN"
```
**Expected (403).**

---

## Frontend Testing (browser)

For each token created above, visit:
```
http://localhost:3000/share/<token>
```

Check:
- [ ] Public link (no password) shows file info + Download button immediately
- [ ] Password-protected link shows the password `Input` field before Download
- [ ] Wrong password on the frontend shows the red error text without navigating away
- [ ] Correct password triggers the browser download (via `window.location.href`)
- [ ] Expired link shows the "expired" error state on page load
- [ ] Revoked link shows "not found" on page load

---

## Quick Reference Table

| Test | Method | Endpoint | Expected Status |
|---|---|---|---|
| Create public share link | POST | `/files/:fileId/share` | 201 |
| Get public link metadata | GET | `/share/:token` | 200 |
| Download via public link | POST | `/share/:token/download` | 200 |
| Create password-protected link | POST | `/files/:fileId/share` | 201 |
| Check requiresPassword flag | GET | `/share/:token` | 200 |
| Download, no password | POST | `/share/:token/download` | 401 |
| Download, wrong password | POST | `/share/:token/download` | 401 |
| Download, correct password | POST | `/share/:token/download` | 200 |
| Access expired link | GET | `/share/:token` | 410 |
| Download after maxDownloads reached | POST | `/share/:token/download` | 410 |
| Revoke own share link | DELETE | `/share/:id` | 200 |
| Access revoked link | GET | `/share/:token` | 404 |
| Revoke another user's link | DELETE | `/share/:id` | 403 |
| 11th+ rapid wrong password attempt | POST | `/share/:token/download` | 429 |
| List share links (owner) | GET | `/files/:fileId/share` | 200 |
| List share links (non-owner) | GET | `/files/:fileId/share` | 403 |

Run this whole guide top to bottom after any change to share-link logic — the password/expiration/download-limit checks are security-critical and worth regression-testing every time.