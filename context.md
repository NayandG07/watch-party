# Context.md

## Project Overview

This project is a **private synchronized watch-party platform** designed for a **small trusted group (approximately 6–8 users, with 2–4 concurrent viewers)**.

The platform is **NOT** intended to become a public streaming service, media server, or social network. It is intentionally optimized for privacy, simplicity, and a polished user experience.

---

# Core Philosophy

## Primary Goal

Create a premium experience where trusted friends can watch media together in perfect synchronization.

This platform is **not** based on screen sharing.

Each viewer streams the media directly from object storage while the backend only synchronizes playback events.

---

# Core Principles

## 1. Privacy First

Everything is private unless explicitly shared.

Default behaviour:

* Libraries are private.
* Collections are private.
* Movies are private.
* Rooms are invite-only.
* User activity is hidden.
* Presence (online/offline) is hidden.
* No "Last Seen".
* No activity feeds.
* No public profiles.

---

## 2. Shared Timeline

The room owns the playback timeline.

Clients do not maintain independent timelines.

If a user buffers:

* Everyone else continues.
* The buffering user catches up automatically.
* Missing a few seconds is preferred over making everyone wait.

The room timeline is the single source of truth.

---

## 3. Backend Never Streams Video

The backend should NEVER proxy or stream media.

Responsibilities:

* Authentication
* Authorization
* Metadata
* Library management
* Room management
* WebSocket synchronization
* Signed URL generation
* Chat

Media always flows:

Backblaze B2
↓

Cloudflare CDN
↓

Client

---

## 4. Small Group Optimization

The system is designed for:

* 6–8 total users
* Usually 2–4 simultaneous viewers

Do NOT optimize for massive scalability.

Prioritize maintainability, simplicity, and UX over distributed infrastructure.

---

# Technology Stack

Frontend

* Next.js
* TypeScript
* Tailwind CSS

Hosting

* Netlify

Backend

* FastAPI
* WebSockets

Database

* PostgreSQL (Supabase)

Storage

* Backblaze B2

CDN

* Cloudflare

Uploader

* Python
* PySide6
* FFmpeg
* FFprobe

Player

* HLS.js

---

# Architecture

Frontend

↓

FastAPI

↓

Supabase PostgreSQL

↓

Backblaze B2

↓

Cloudflare CDN

Clients stream directly from Cloudflare.

Backend never handles video data.

---

# User Roles

## Super Admin

Platform owner.

Full access.

Only one.

---

## Level 2

Trusted contributor.

Can:

* Connect personal storage
* Upload media
* Manage own libraries
* Create collections
* Share collections
* Manage own permissions

Cannot modify the Super Admin's private content.

---

## Level 1

Default member.

Can:

* Browse shared content
* Watch media
* Create rooms using media they have permission to access
* Invite users through room links
* Chat inside rooms

Cannot:

* Upload
* Connect storage
* Manage platform configuration

---

# Storage Model

Every Level 2 user may connect their own Backblaze B2 bucket.

The platform stores metadata only.

Media always remains inside the owner's storage.

Storage ownership and library ownership are linked.

The architecture should support multiple storage providers in the future through provider interfaces.

Do not tightly couple the system to Backblaze.

---

# Library Structure

User

↓

Library

↓

Collections

↓

Movies / Series

Permissions are primarily assigned at the Collection level.

Individual movies may override collection permissions.

Default visibility is always Private.

---

# Visibility

Collection visibility:

* Private
* Selected Friends
* Shared

Movie visibility:

Inherits collection by default.

Can optionally override.

---

# Rooms

Rooms are always created through invite links.

Having an account does NOT automatically allow joining rooms.

Users join only through invitation.

Room owners may lock rooms after everyone joins.

---

# Synchronization

The room owns:

* Current timestamp
* Playback state
* Playback speed

Clients report:

* Current position
* Buffer state
* Playback status

If drift is small:

* Smooth correction

If drift is large:

* Seek to room position

If buffering occurs:

* Catch user up to current room time

Never pause everyone because one user is buffering.

---

# Video Playback

Required

* HLS playback
* Manual quality selection
* Automatic quality selection
* Subtitle switching
* Audio track switching
* Chapter support
* Fullscreen
* Picture in Picture
* Playback speed
* Keyboard shortcuts
* Timeline thumbnails

Quality selection is always local.

Example:

User A

2160p

User B

720p

Both remain synchronized.

---

# Uploader

Uploader is manually launched.

No background service.

No folder watching.

Workflow:

Open

↓

Select Files / Folder

↓

Analyze

↓

Process

↓

Generate HLS

↓

Generate Thumbnails

↓

Extract Audio

↓

Extract Subtitles

↓

Extract Chapters

↓

Generate Metadata

↓

Upload

↓

Close

Uploader should support:

* Resume uploads
* Queue
* Batch processing
* Dry run (analysis only)
* Processing presets
* Logs

Internally separate:

Processing Pipeline

from

Upload Pipeline

to avoid unnecessary re-encoding.

---

# Metadata

Automatically detect:

* Resolution
* Codec
* Duration
* Audio tracks
* Subtitle tracks
* Chapters

Future metadata providers should be abstracted.

---

# Social Features

Do NOT build:

* Activity feeds
* Public profiles
* Followers
* Likes
* Public comments
* Public discovery
* Communities

The platform is not intended to become a social network.

---

# Performance Philosophy

Optimize for:

* Fast startup
* Smooth playback
* Minimal latency
* Reliable synchronization
* Clean UI

Not for horizontal scaling.

---

# Development Philosophy

Keep modules independent.

Suggested modules:

* Authentication
* Users
* Libraries
* Collections
* Movies
* Storage Providers
* Rooms
* Synchronization
* Player
* Chat
* Uploader

Avoid tightly coupling modules.

---

# Repository Structure

watch-party/

├── frontend/

├── backend/

├── uploader/

├── shared/

├── docker/

├── docs/

├── design/

└── scripts/

---

# Important Constraints

* Never implement screen sharing.
* Never proxy video through the backend.
* Never make user activity public by default.
* Never assume scalability beyond a small trusted group.
* Keep code modular and maintainable.
* Prioritize user experience over unnecessary complexity.

---

# Overall Vision

The project should feel like a combination of:

* YouTube's video player
* Netflix's browsing experience
* Watch2Gether's synchronization

while remaining:

* Private
* Invite-only
* Storage-independent
* Lightweight
* Easy to self-host
* Designed specifically for a trusted group of friends
