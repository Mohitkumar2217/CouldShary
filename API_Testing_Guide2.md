# API Testing Guide — Phases 4–6 (Upload, Chunked Upload, Folders)

Builds on `api-testing-guide.md` (Phases 1–3: health check, auth, `/me`). Make sure your API and Docker containers (Postgres, Redis) are running before starting:

```bash
docker compose ps   # confirm postgres + redis are Up (healthy)
cd backend && npm run dev
```

You'll need a valid `ACCESS_TOKEN` from logging in (see Phase 1–3 guide). Set it once:
```bash
export ACCESS_TOKEN="paste-your-token-here"
```

---

## Phase 4 — Basic File Upload & Download

### 1. Upload a small file

```bash
curl -X POST http://localhost:4000/files/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@/path/to/a/small-test-file.txt"
```

**Expected (201 Created):**
```json
{
  "file": {
    "id": "uuid-here",
    "name": "small-test-file.txt",
    "size": 1234,
    "mimeType": "text/plain",
    "storageKey": "user-uuid/random-uuid.txt",
    "ownerId": "user-uuid",
    "folderId": null
  }
}
```

Save the `id` for the next steps:
```bash
export FILE_ID="paste-the-file-id-here"
```

**Verify manually:**
- File visible in Supabase dashboard → Storage → under `<userId>/` path
- Row visible in Prisma Studio's `File` table

### 2. Upload with no file (should fail)

```bash
curl -X POST http://localhost:4000/files/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```
**Expected (400):**
```json
{"error":"No file provided"}
```

### 3. Get a download link

```bash
curl http://localhost:4000/files/$FILE_ID/download \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```
**Expected (200):**
```json
{"url":"https://...signed-url...","expiresIn":300}
```

Paste the `url` value into a browser — it should download/display the file.

### 4. Download as a different user (should fail)

Register/login a second test user, get their token, then:
```bash
curl http://localhost:4000/files/$FILE_ID/download \
  -H "Authorization: Bearer $OTHER_USER_TOKEN"
```
**Expected (403):**
```json
{"error":"Forbidden"}
```

### 5. Download a nonexistent file

```bash
curl http://localhost:4000/files/00000000-0000-0000-0000-000000000000/download \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```
**Expected (404):**
```json
{"error":"File not found"}
```

---

## Phase 5 — Chunked Upload

Testing this via curl is more tedious than a script, since you need to slice a file and send multiple requests. Here's a small Node script to do it — save as `backend/src/scripts/test-chunked-upload.ts`:

```typescript
import "dotenv/config";
import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:4000";
const TOKEN = process.env.TEST_ACCESS_TOKEN!; // set this env var before running
const FILE_PATH = process.argv[2]; // pass file path as CLI arg
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB for quick testing

async function main() {
  const stat = fs.statSync(FILE_PATH);
  const totalChunks = Math.ceil(stat.size / CHUNK_SIZE);

  const initRes = await fetch(`${API_BASE}/files/upload/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({
      filename: path.basename(FILE_PATH),
      mimetype: "application/octet-stream",
      size: stat.size,
      totalChunks,
    }),
  });
  const { uploadId } = await initRes.json();
  console.log("uploadId:", uploadId);

  const fd = fs.openSync(FILE_PATH, "r");
  for (let i = 0; i < totalChunks; i++) {
    const buffer = Buffer.alloc(Math.min(CHUNK_SIZE, stat.size - i * CHUNK_SIZE));
    fs.readSync(fd, buffer, 0, buffer.length, i * CHUNK_SIZE);

    const formData = new FormData();
    formData.append("chunk", new Blob([buffer]), "chunk");
    formData.append("chunkIndex", String(i));

    const res = await fetch(`${API_BASE}/files/upload/chunk/${uploadId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: formData,
    });
    const data = await res.json();
    console.log(`Chunk ${i + 1}/${totalChunks}:`, data);
  }
  fs.closeSync(fd);

  const completeRes = await fetch(`${API_BASE}/files/upload/complete/${uploadId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  console.log("Complete:", await completeRes.json());
}

main();
```

Run it:
```bash
export TEST_ACCESS_TOKEN=$ACCESS_TOKEN
npx ts-node src/scripts/test-chunked-upload.ts /path/to/a/large-test-file.bin
```

**Expected:** console prints `uploadId`, then each chunk's `receivedChunks`/`totalChunks` incrementing correctly, then a final `Complete:` log with the created `file` object.

### Test: complete before all chunks sent

Run the `init` step only, then immediately try:
```bash
curl -X POST http://localhost:4000/files/upload/complete/<uploadId> \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```
**Expected (400):**
```json
{"error":"Not all chunks received","receivedChunks":"0","totalChunks":"..."}
```

### Test: check status mid-upload

```bash
curl http://localhost:4000/files/upload/status/<uploadId> \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```
**Expected (200):**
```json
{"receivedChunks":3,"totalChunks":10}
```

### Test: verify temp file cleanup

After a successful `complete`, check:
```bash
ls backend/tmp-uploads/
```
**Expected:** the temp file for that `uploadId` is gone (deleted after successful upload to Supabase).

---

## Phase 6 — Folder Management

### 1. Create a root folder

```bash
curl -X POST http://localhost:4000/folders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"name":"Documents"}'
```
**Expected (201):**
```json
{"folder":{"id":"uuid","name":"Documents","parentFolderId":null,...}}
```
```bash
export FOLDER_ID="paste-the-folder-id"
```

### 2. Create a nested folder

```bash
curl -X POST http://localhost:4000/folders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"name\":\"Invoices\",\"parentFolderId\":\"$FOLDER_ID\"}"
```
**Expected (201):** folder created with `parentFolderId` set to `$FOLDER_ID`.
```bash
export SUBFOLDER_ID="paste-the-subfolder-id"
```

### 3. List root contents

```bash
curl http://localhost:4000/folders \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```
**Expected:** `{"folders":[{"name":"Documents",...}],"files":[...]}`

### 4. List a specific folder's contents

```bash
curl "http://localhost:4000/folders?folderId=$FOLDER_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```
**Expected:** `folders` array contains "Invoices"; `files` array contains anything uploaded directly into Documents.

### 5. Breadcrumbs

```bash
curl http://localhost:4000/folders/$SUBFOLDER_ID/breadcrumbs \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```
**Expected:**
```json
{"breadcrumbs":[{"id":"...","name":"Documents"},{"id":"...","name":"Invoices"}]}
```

### 6. Rename a folder

```bash
curl -X PATCH http://localhost:4000/folders/$FOLDER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"name":"My Documents"}'
```
**Expected:** `folder.name` updated to `"My Documents"`.

### 7. Move a folder

Create a third folder ("Archive") at root, then:
```bash
curl -X PATCH http://localhost:4000/folders/$SUBFOLDER_ID/move \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"newParentFolderId":"<archive-folder-id>"}'
```
**Expected:** `Invoices` now has `parentFolderId` = Archive's id.

### 8. Move a folder into itself (should fail)

```bash
curl -X PATCH http://localhost:4000/folders/$FOLDER_ID/move \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"newParentFolderId\":\"$FOLDER_ID\"}"
```
**Expected (400):**
```json
{"error":"Cannot move a folder into itself"}
```

### 9. Move a folder into its own descendant (should fail)

```bash
curl -X PATCH http://localhost:4000/folders/$FOLDER_ID/move \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"newParentFolderId\":\"$SUBFOLDER_ID\"}"
```
**Expected (400):**
```json
{"error":"Cannot move a folder into its own descendant"}
```

### 10. Move a file into a folder

```bash
curl -X PATCH http://localhost:4000/folders/files/$FILE_ID/move \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"newFolderId\":\"$FOLDER_ID\"}"
```
**Expected:** file's `folderId` updated.

### 11. Delete a folder (recursive soft-delete)

```bash
curl -X DELETE http://localhost:4000/folders/$FOLDER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```
**Expected (200):** `{"message":"Folder deleted"}`

**Verify via Prisma Studio:** `Documents`, `Invoices` (nested), and any files inside either should all show a populated `deletedAt` timestamp — nothing physically removed.

### 12. Cross-user permission checks

Using a second user's token, repeat steps 6, 7, 10, and 11 against the first user's folder/file IDs.
**Expected for all:** `403 Forbidden`.

---

## Quick Reference Table

| Test | Method | Endpoint | Expected Status |
|---|---|---|---|
| Upload small file | POST | `/files/upload` | 201 |
| Upload with no file | POST | `/files/upload` | 400 |
| Get download link (owner) | GET | `/files/:id/download` | 200 |
| Get download link (other user) | GET | `/files/:id/download` | 403 |
| Download nonexistent file | GET | `/files/:id/download` | 404 |
| Chunked upload init | POST | `/files/upload/init` | 201 |
| Chunk upload | POST | `/files/upload/chunk/:uploadId` | 200 |
| Status mid-upload | GET | `/files/upload/status/:uploadId` | 200 |
| Complete before all chunks | POST | `/files/upload/complete/:uploadId` | 400 |
| Complete after all chunks | POST | `/files/upload/complete/:uploadId` | 201 |
| Create root folder | POST | `/folders` | 201 |
| Create nested folder | POST | `/folders` | 201 |
| List root | GET | `/folders` | 200 |
| List folder contents | GET | `/folders?folderId=` | 200 |
| Breadcrumbs | GET | `/folders/:id/breadcrumbs` | 200 |
| Rename folder | PATCH | `/folders/:id` | 200 |
| Move folder | PATCH | `/folders/:id/move` | 200 |
| Move folder into itself | PATCH | `/folders/:id/move` | 400 |
| Move folder into own descendant | PATCH | `/folders/:id/move` | 400 |
| Move file into folder | PATCH | `/folders/files/:id/move` | 200 |
| Delete folder (recursive) | DELETE | `/folders/:id` | 200 |
| Any op on another user's resource | any | any | 403 |

Run this top-to-bottom as a regression check any time you touch upload, chunked upload, or folder code.