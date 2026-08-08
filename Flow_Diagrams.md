# SecureShare — System Diagrams

Three diagrams covering how requests flow through the system, how background jobs are processed, and what a user actually does moving through the app. Rendered automatically by GitHub, GitLab, and most markdown viewers (Mermaid syntax).

---

## 1. System Architecture

The frontend never talks to the database, Redis, or storage directly — everything routes through the Express API.

```mermaid
flowchart TD
    A[Next.js Frontend] -->|HTTPS| B[Express API]
    B --> C[(PostgreSQL<br/>users, files, links)]
    B --> D[(Redis<br/>sessions, job queue)]
    B --> E[(Supabase Storage<br/>file bytes)]
```

---

## 2. Background Job Flow

Emails, thumbnail generation, and cleanup tasks never block a request — the API enqueues a job and returns immediately; a worker processes it separately.

```mermaid
flowchart TD
    A[Express API] -->|enqueues job| B[Redis Queue<br/>BullMQ]
    B --> C[Email Worker]
    B --> D[Thumbnail Worker]
    B --> E[Cleanup Worker]
    C -->|sends via| F[Resend API]
    D -->|resizes with sharp,<br/>uploads to| G[(Supabase Storage)]
    E -->|expires links,<br/>purges soft-deleted files| H[(PostgreSQL)]
```

---

## 3. User Journey

The path a new user takes from signing up to a recipient downloading their shared file.

```mermaid
flowchart TD
    A[Register] --> B[Receive verification email]
    B --> C[Click verify link]
    C --> D[Login]
    D --> E[Dashboard]
    E --> F[Upload file<br/>drag-and-drop or chunked]
    E --> G[Create folder<br/>organize files]
    F --> H[Create share link]
    H --> I{Password<br/>protected?}
    I -->|Yes| J[Recipient enters password]
    I -->|No| K[Recipient downloads directly]
    J --> K
    K --> L[Signed URL issued<br/>5-minute expiry]
```

---
 