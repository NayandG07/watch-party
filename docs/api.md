# Watch Party — API Reference

> Base URL: `http://localhost:8000` (development) | `https://api.yourdomain.com` (production)
> All endpoints (except `/api/health`) require authentication.
> Authentication: `Authorization: Bearer <access_token>` header, or `access_token` httpOnly cookie.

---

## Health

### GET /api/health

Public endpoint. Used by load balancers, Docker healthchecks, and uptime monitors.

**Response `200 OK`**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "environment": "development",
  "database": "ok"
}
```

The `database` field is `"ok"` if the live DB connection succeeds, otherwise `"error"`.

---

## Authentication

### POST /api/auth/login

Authenticate with username/email and password.

**Request body**
```json
{
  "username": "alice",
  "password": "secret"
}
```

**Response `200 OK`**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "alice",
    "role": "level1"
  }
}
```

Sets `refresh_token` as an httpOnly cookie.

**Errors**
- `401` — Invalid credentials
- `403` — Account deactivated

---

### POST /api/auth/refresh

Issue a new access token using the refresh token cookie.

**Response `200 OK`**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

**Errors**
- `401` — Missing or invalid refresh token

---

### POST /api/auth/logout

Invalidate the refresh token cookie.

**Response `204 No Content`**

---

### POST /api/auth/register

Register a new account using a valid invite token.

**Request body**
```json
{
  "invite_token": "eyJ...",
  "username": "bob",
  "email": "bob@example.com",
  "password": "strongpassword"
}
```

**Response `201 Created`**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": "uuid", "username": "bob", "role": "level1" }
}
```

**Errors**
- `410` — Invite expired or revoked
- `409` — Username or email already taken

---

### GET /api/auth/me

Return the current authenticated user.

**Response `200 OK`**
```json
{
  "id": "uuid",
  "username": "alice",
  "email": "alice@example.com",
  "role": "level1",
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

## Invites *(super_admin only)*

### POST /api/invites

Create a registration invite link.

**Request body**
```json
{
  "expires_in_hours": 48,
  "max_uses": 1
}
```

**Response `201 Created`**
```json
{
  "token": "eyJ...",
  "invite_url": "https://yourapp.com/register?token=eyJ...",
  "expires_at": "2025-01-03T00:00:00Z"
}
```

---

## Libraries

### GET /api/libraries

List all libraries visible to the current user.

**Response `200 OK`**
```json
[
  {
    "id": "uuid",
    "name": "My Collection",
    "owner": { "id": "uuid", "username": "alice" },
    "is_private": false,
    "collection_count": 3
  }
]
```

---

### POST /api/libraries *(level2+)*

Create a new library.

**Request body**
```json
{
  "name": "My Movies",
  "storage_provider_id": "uuid"
}
```

---

## Collections

### GET /api/collections

List collections visible to the current user.

**Query params**
- `library_id` (optional) — filter by library

---

### POST /api/collections *(level2+)*

Create a collection.

**Request body**
```json
{
  "library_id": "uuid",
  "name": "Action Movies",
  "visibility": "private",
  "description": "..."
}
```

---

## Movies

### GET /api/movies

List movies visible to the current user.

**Query params**
- `collection_id` (optional)
- `search` (optional)

---

### GET /api/movies/{id}

Get movie detail including metadata.

**Response `200 OK`**
```json
{
  "id": "uuid",
  "title": "Movie Title",
  "duration_seconds": 7200,
  "resolution": "1920x1080",
  "codec": "h264",
  "audio_tracks": [{ "index": 0, "language": "en", "label": "English" }],
  "subtitle_tracks": [{ "index": 0, "language": "en", "label": "English" }],
  "chapters": [{ "start": 0, "title": "Opening" }],
  "thumbnail_url": "https://cdn.example.com/thumb.jpg",
  "poster_url": "https://cdn.example.com/poster.jpg"
}
```

---

### POST /api/movies/{id}/playback-token

Request a short-lived signed token for HLS playback.

**Response `200 OK`**
```json
{
  "hls_url": "https://cdn.example.com/movies/uuid/master.m3u8?token=...",
  "hls_key_token": "eyJ...",
  "expires_at": "2025-01-01T01:00:00Z"
}
```

---

## Rooms

### POST /api/rooms

Create a new watch room.

**Request body**
```json
{
  "name": "Movie Night",
  "movie_id": "uuid"
}
```

**Response `201 Created`**
```json
{
  "id": "uuid",
  "slug": "abc123",
  "invite_url": "https://yourapp.com/room/abc123",
  "name": "Movie Night",
  "movie_id": "uuid",
  "state": "waiting"
}
```

---

### GET /api/rooms/{id}/ws-token

Issue a 60-second one-time token for WebSocket upgrade.

**Response `200 OK`**
```json
{ "ws_token": "eyJ..." }
```

---

## Synchronization (WebSocket)

Connect: `wss://api.yourdomain.com/api/rooms/{id}/ws?token=<ws_token>`

See [sync-protocol.md](sync-protocol.md) for the full message specification.

---

## HLS Key Endpoint

### GET /api/playback/hls-key

Called by HLS.js when it encounters an `#EXT-X-KEY` URI in the playlist.

**Query params**
- `token` — `hls_key_token` from the playback token endpoint

**Response `200 OK`**
- Body: raw 16-byte AES-128 key (binary, not base64)
- `Content-Type: application/octet-stream`

**Errors**
- `401` — Missing or expired token
- `403` — User no longer has access to this movie
