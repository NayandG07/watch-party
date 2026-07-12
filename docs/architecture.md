# Architecture

## System Overview

Watch Party is a private synchronized watch-party platform for a trusted group of 6–8 users.

The core architectural constraint is: **the backend never proxies video**.

---

## Data Flow

### Media Streaming (read-only)

```
Client (HLS.js)
    ↓  (1) Request signed CDN URL
FastAPI Backend
    ↓  (2) Return pre-signed URL
Client
    ↓  (3) Fetch HLS playlist from CDN
Cloudflare CDN
    ↓  (4) Cache + serve segments
Backblaze B2 (origin)
```

The backend participates only in step 1 (issuing a short-lived signed URL). All subsequent media requests go directly to Cloudflare, bypassing the backend entirely.

### HLS AES-128 Key Flow

```
Client (HLS.js intercepts key request)
    ↓  Authorization: Bearer <hls_key_token>
FastAPI /api/playback/hls-key
    ↓  Validate token + permission
    ↓  Decrypt key from DB (AES-256-GCM)
    ↓  Return raw 16-byte AES-128 key
Client
    ↓  Decrypt HLS segments locally
```

Segments stored in B2 are AES-128 encrypted. Even with a raw signed URL, segments cannot be played without the key from the backend.

### Room Synchronization

```
Host Client ──── WebSocket ────► Room Manager (in-memory)
                                      │
                                      │ Broadcast
                     ┌────────────────┼────────────────┐
                     ▼                ▼                ▼
               Viewer A          Viewer B          Viewer C
```

The Room Manager maintains an authoritative clock:

```
current_position = stored_position + (now - last_updated_at) × playback_speed
```

Clients report their position every 2 seconds. The server calculates drift and sends correction messages:

| Drift | Action |
|-------|--------|
| < 2 s | Adjust `playbackRate` by ±0.05 |
| 2–5 s | Soft seek (no flash) |
| > 5 s | Hard seek |

---

## Component Map

```
watch-party/
│
├── frontend/
│   ├── Authentication     Login, registration (invite-only), token refresh
│   ├── Library Browser    Netflix-style collection/movie grid
│   ├── Movie Detail       Metadata, Watch Now, share
│   ├── Video Player       HLS.js wrapper + full controls
│   └── Room               Synchronized player + chat
│
├── backend/
│   ├── api/auth           JWT login/logout/refresh/register
│   ├── api/users          User management (admin only)
│   ├── api/libraries      Library CRUD + permissions
│   ├── api/collections    Collection CRUD + visibility
│   ├── api/movies         Movie CRUD + signed URL generation
│   ├── api/rooms          Room lifecycle management
│   ├── api/sync           WebSocket synchronization engine
│   ├── api/chat           In-room chat (over sync WebSocket)
│   └── api/storage        Storage provider management
│
├── uploader/
│   ├── core/analyzer      FFprobe media analysis
│   ├── core/processor     FFmpeg HLS pipeline + AES-128 keys
│   ├── core/uploader      Multipart B2 upload with resume
│   ├── core/queue         Job queue
│   └── gui/               PySide6 desktop application
│
└── shared/
    └── types/             TypeScript ↔ Pydantic schema mirrors
```

---

## Database Schema (logical)

```
User ─────────────── StorageProvider (1:many)
  │
  └── Library ──────── Collection ──── Movie
                             │              │
                        Permission      HLSKey
                       (grant table)

Room ──── RoomMember (many:many with User)
  │
  ├── Movie (FK)
  └── ChatMessage

Invite ─── User (invited_by FK)
        └── Room (optional FK, for room invites)
```

### Permission Resolution

```
can_view(user, movie)?
    │
    ├── user.role == super_admin → TRUE
    │
    ├── movie.visibility_override == "private" → owner only
    ├── movie.visibility_override == "shared"  → all platform users
    ├── movie.visibility_override == null       → inherit collection
    │
    ├── collection.visibility == "private"  → owner only
    ├── collection.visibility == "shared"   → all platform users
    └── collection.visibility == "friends"  → explicit Permission grant
```

---

## Storage Provider Interface

The application never calls B2 APIs directly from business logic. All storage operations go through a `StorageProvider` abstract base class:

```python
class StorageProvider(ABC):
    async def generate_signed_url(self, key: str, expires_in: int) -> str: ...
    async def upload_multipart(self, key: str, data: AsyncIterator[bytes]) -> str: ...
    async def delete(self, key: str) -> None: ...
    async def list_objects(self, prefix: str) -> list[StorageObject]: ...
```

Current implementation: `B2StorageProvider`
Future: `R2StorageProvider`, `S3StorageProvider`, `MinIOStorageProvider`

---

## Security Model

| Concern | Mechanism |
|---------|-----------|
| Authentication | JWT (access + refresh tokens) |
| Token transport | Bearer header or httpOnly cookie |
| Password storage | bcrypt (cost factor 12) |
| Storage credentials | AES-256-GCM, key in env var |
| HLS segments | AES-128 encrypted at rest in B2 |
| HLS key access | Short-lived signed token, validated per-request |
| WebSocket auth | One-time 60-second ws_token query param |
| CORS | Allowlist of known frontend origins |

---

## Deployment Topology

```
Internet
   │
   ├── Netlify (frontend)  ──── Next.js SSR/SSG
   │
   └── Docker host         ──── FastAPI backend
            │
            └── Supabase (hosted PostgreSQL, managed by Supabase)
```

Cloudflare sits in front of Backblaze B2 as a CDN/cache layer. The backend has no direct dependency on Cloudflare — it only generates B2 signed URLs.
