# Watch Party

A full-stack synchronized video watch party platform built with FastAPI, Next.js, and WebSockets.

## Features
- **Real-time Synchronization:** Perfect synchronized video playback across all clients in a room.
- **Live Chat:** Real-time chat with text, emoji reactions, and clickable timestamp sharing.
- **Role-based Access Control:** Super admins, contributors, and members with granular library permissions.
- **Invite System:** Secure JWT-based invite links for new user registration and private room access.
- **Media Library:** Browse, manage, and play your private collection of media files (HLS/Dash or mp4).

## Tech Stack
**Backend:**
- Python 3.13 + FastAPI
- SQLAlchemy + Asyncpg (PostgreSQL)
- WebSockets for real-time signaling
- JWT Auth (Access & Refresh tokens)

**Frontend:**
- Next.js 14 (App Router) + React
- Tailwind CSS
- Zustand for state management
- Lucide React for iconography

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL database

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `pip install -r requirements.txt` (or via hatch/poetry)
3. Set up your environment variables in `.env` (Database URL, JWT Secret)
4. Run migrations: `alembic upgrade head`
5. Start the server: `uvicorn app.main:app --reload --port 8000`

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Configure your `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000`
4. Start the development server: `npm run dev`

## Administration
To generate an initial admin account, run the backend CLI tool (if configured) or manually update your first user's role to `super_admin` in the database.
Once logged in as an admin, navigate to the **Settings > Users** page to generate invite links for new members.

## License
MIT License
