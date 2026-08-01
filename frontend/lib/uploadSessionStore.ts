const DB_NAME = "file-upload-sessions";
const STORE_NAME = "sessions";

interface UploadSession {
  fingerprint: string; // `${name}-${size}-${lastModified}`
  uploadId: string;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "fingerprint" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function getFileFingerprint(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export async function saveUploadSession(fingerprint: string, uploadId: string) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put({ fingerprint, uploadId, createdAt: Date.now() });
  return new Promise((resolve) => (tx.oncomplete = () => resolve(undefined)));
}

export async function getUploadSession(fingerprint: string): Promise<UploadSession | undefined> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readonly");
  return new Promise((resolve) => {
    const req = tx.objectStore(STORE_NAME).get(fingerprint);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(undefined);
  });
}

export async function deleteUploadSession(fingerprint: string) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(fingerprint);
  return new Promise((resolve) => (tx.oncomplete = () => resolve(undefined)));
}