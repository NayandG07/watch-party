# Watch Party

> A private, synchronized watch-party platform for a small trusted group.

Watch movies together in perfect sync - Netflix browsing feel, YouTube player quality, Watch2Gether synchronization - with complete privacy.

---

## Architecture at a glance

```
Frontend (Next.js / Netlify)
         ↓
FastAPI Backend  ←→  Supabase PostgreSQL
         ↓
   [Signed URLs]
         ↓
Backblaze B2 → Cloudflare CDN → Client
```

**The backend never proxies video.** All media streams directly from Backblaze B2 via Cloudflare CDN. The backend only coordinates authentication, permissions, metadata, signed URLs, and WebSocket synchronization.

---

## Technology stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Hosting | Netlify |
| Backend | FastAPI (Python 3.12), async |
| Database | PostgreSQL via Supabase |
| Storage | Backblaze B2 |
| CDN | Cloudflare |
| Video | FFmpeg, HLS.js |
| Uploader | Python + PySide6 |

---

## Repository structure

```
watch-party/
├── frontend/          Next.js application
├── backend/           FastAPI application
├── uploader/          Python desktop uploader (PySide6 + CLI)
├── shared/            Shared types and constants
├── docker/            Docker Compose configurations
├── docs/              Architecture and API documentation
├── design/            Wireframes and design assets
├── scripts/           Utility scripts
└── context.md         Project vision and constraints
```

---

## Quick start

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker (for running the backend locally)
- A [Supabase](https://supabase.com) project (free tier works)
- A [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html) bucket

### 1. Clone and generate secrets

```bash
git clone <repo-url> watch-party
cd watch-party
python scripts/generate-keys.py
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env — fill in DATABASE_URL, SECRET_KEY, ENCRYPTION_KEY, HLS_KEY_SIGNING_SECRET
```

### 3. Run the backend (Docker)

```bash
cd docker
cp .env.example .env
# Edit docker/.env with same values
docker compose up
```

Backend will be available at `http://localhost:8000`.
API docs: `http://localhost:8000/api/docs`

### 4. Run the frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local with your backend URL
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`.

### 5. Run database migrations

```bash
cd backend
pip install -e ".[dev]"
alembic upgrade head
```

---

## Development workflow

### Backend (hot-reload via Docker)

```bash
docker compose -f docker/docker-compose.yml up
```

Or run directly:

```bash
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm run dev
```

### Running tests

```bash
cd backend
pytest -v
```

---

## Environment variables

See `backend/.env.example` for all backend variables with documentation.

See `frontend/.env.local.example` for all frontend variables.

### Required secrets (never commit these)

| Variable | Description | How to generate |
|----------|-------------|-----------------|
| `SECRET_KEY` | JWT signing key | `python scripts/generate-keys.py` |
| `ENCRYPTION_KEY` | AES-256 key for storage credentials | `python scripts/generate-keys.py` |
| `HLS_KEY_SIGNING_SECRET` | HLS AES-128 key signing | `python scripts/generate-keys.py` |
| `DATABASE_URL` | Supabase connection string | Supabase Dashboard → Settings → Database |

---

## User roles

| Role | Capabilities |
|------|-------------|
| `super_admin` | Full platform access, user management, all content |
| `level2` | Upload media, manage own libraries, share collections |
| `level1` | Browse shared content, watch media, create/join rooms |

New users join via invite link only. Registration is closed by default.

---

## Core principles (do not violate)

1. **Backend never proxies video** — signed URLs only
2. **No screen sharing** — sync via shared playback state
3. **Private by default** — all content, rooms, and activity
4. **Sync is the priority** — buffering users catch up; nobody waits
5. **Small group only** — optimized for 6–8 users, not thousands

---

## Deployment

### Backend (Docker)

```bash
docker build -t watchparty-backend:latest ./backend
docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d
```

### Frontend (Netlify)

Push to `main` branch — Netlify auto-deploys.
Configure `NEXT_PUBLIC_API_URL` in Netlify environment variables.

---

## Documentation

- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Sync Protocol](docs/sync-protocol.md)
- [Storage Providers](docs/storage-providers.md)
- [Uploader Guide](docs/uploader.md)
- [Deployment Guide](docs/deployment.md)

---

## License

Private — for personal use by invited members only.
