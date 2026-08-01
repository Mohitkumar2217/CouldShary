import { getFileFingerprint, getUploadSession, saveUploadSession, deleteUploadSession } from "./uploadSessionStore";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
const API_BASE = "http://localhost:7000";

export async function uploadFileChunked(
  file: File,
  onProgress: (percent: number) => void,
  folderId?: string
) {
  const token = localStorage.getItem("accessToken");
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const fingerprint = getFileFingerprint(file);

  let uploadId: string;
  let startChunk = 0;

  // Check if we have a previous session for this exact file
  const existingSession = await getUploadSession(fingerprint);

  if (existingSession) {
    // Ask the server how many chunks it actually has — server is the source of truth
    const statusRes = await fetch(`${API_BASE}/files/upload/status/${existingSession.uploadId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (statusRes.ok) {
      const status = await statusRes.json();
      uploadId = existingSession.uploadId;
      startChunk = status.receivedChunks;
    } else {
      // Session expired/not found server-side — start fresh
      await deleteUploadSession(fingerprint);
      uploadId = await initUpload(file, totalChunks, folderId, token);
      await saveUploadSession(fingerprint, uploadId);
    }
  } else {
    uploadId = await initUpload(file, totalChunks, folderId, token);
    await saveUploadSession(fingerprint, uploadId);
  }

  // Upload only the chunks not yet received
  for (let i = startChunk; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("chunkIndex", String(i));

    let attempt = 0;
    while (attempt < 3) {
      try {
        const res = await fetch(`${API_BASE}/files/upload/chunk/${uploadId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error("Chunk upload failed");
        break;
      } catch (err) {
        attempt++;
        if (attempt === 3) throw err;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }

    onProgress(Math.round(((i + 1) / totalChunks) * 100));
  }

  const completeRes = await fetch(`${API_BASE}/files/upload/complete/${uploadId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  await deleteUploadSession(fingerprint); // clean up regardless of outcome

  if (!completeRes.ok) {
    const data = await completeRes.json();
    throw new Error(data.error || "Failed to complete upload");
  }

  return completeRes.json();
}

async function initUpload(file: File, totalChunks: number, folderId: string | undefined, token: string | null) {
  const res = await fetch(`${API_BASE}/files/upload/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename: file.name,
      mimetype: file.type || "application/octet-stream",
      size: file.size,
      totalChunks,
      folderId,
    }),
  });
  const { uploadId } = await res.json();
  return uploadId;
}