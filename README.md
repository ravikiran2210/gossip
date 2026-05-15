# Messenger — Admin-Gated Realtime Chat

A web-first, admin-gated realtime messenger application built with a modern, scalable, free-tier-friendly stack.

## Architecture Overview

```
messenger-web/
├── apps/
│   ├── backend/          # NestJS API + Socket.IO (→ Render)
│   └── web/              # Next.js 14 App Router (→ Vercel)
├── packages/
│   ├── shared/           # Shared types + Socket.IO event constants
│   └── config/           # Shared constants
├── docs/
├── package.json
├── pnpm-workspace.yaml
└── .env.example
```

## Stack

| Layer        | Technology                           | Free Tier         |
|-------------|--------------------------------------|-------------------|
| Frontend     | Next.js 14 · TypeScript · Tailwind  | Vercel Hobby      |
| Backend      | NestJS · TypeScript · Socket.IO      | Render Free       |
| Database     | MongoDB Atlas · Mongoose             | Atlas Free M0     |
| Media        | Cloudinary SDK                       | Cloudinary Free   |
| Local Cache  | Dexie (IndexedDB)                    | Browser-native    |
| Auth         | JWT (access token)                   | —                 |
| State (web)  | Zustand + persist                    | —                 |

---

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- MongoDB Atlas account (free) → [atlas.mongodb.com](https://cloud.mongodb.com)
- Cloudinary account (free) → [cloudinary.com](https://cloudinary.com)
- Vercel account (free) → [vercel.com](https://vercel.com)
- Render account (free) → [render.com](https://render.com)

---

## Quick Start (Local Development)

### 1. Clone / enter directory

```bash
cd messenger-web
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

**Backend** — copy and fill in `apps/backend/.env`:

```bash
cp .env.example apps/backend/.env
```

Edit `apps/backend/.env` with your real values (see Environment Variables section).

**Frontend** — copy and fill in `apps/web/.env.local`:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

### 4. Run backend

```bash
pnpm dev:backend
# or
cd apps/backend && pnpm dev
```

Backend starts at http://localhost:4000
Swagger docs at http://localhost:4000/api

### 5. Run frontend

```bash
pnpm dev:web
# or
cd apps/web && pnpm dev
```

Frontend starts at http://localhost:3000

---

## Environment Variables

### Backend (`apps/backend/.env`)

```env
NODE_ENV=development
PORT=4000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/messenger?retryWrites=true&w=majority

# JWT
JWT_ACCESS_SECRET=your_super_secret_access_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# First admin (seeded on backend startup)
ADMIN_SEED_NAME=Super Admin
ADMIN_SEED_EMAIL=admin@yourdomain.com
ADMIN_SEED_USERNAME=superadmin
ADMIN_SEED_PASSWORD=YourStrongPassword123!

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_FOLDER=messenger

# Media limits (optional — defaults shown)
MAX_IMAGE_SIZE_MB=10
MAX_VIDEO_SIZE_MB=100
MAX_AUDIO_SIZE_MB=20
MAX_FILE_SIZE_MB=50

# CORS
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Access code expiry
ACCESS_CODE_EXPIRES_HOURS=48
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

## MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free account.
2. Create a **Free M0** cluster (AWS / us-east-1 recommended).
3. Under **Database Access** → Add a user with `readWriteAnyDatabase` role.
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all) during development.
   - For Render, add Render's static outbound IPs if available on your plan (see Render docs).
5. Click **Connect → Drivers** and copy the connection string.
6. Replace `<password>` with your database user password.
7. Set it as `MONGODB_URI` in your backend `.env`.

---

## Cloudinary Setup

1. Go to [cloudinary.com](https://cloudinary.com) and create a free account.
2. From the **Dashboard**, copy:
   - Cloud Name
   - API Key
   - API Secret
3. Set these as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
4. Optionally set `CLOUDINARY_UPLOAD_FOLDER=messenger` to organize uploads.

---

## Seeding the First Admin

The admin is **seeded automatically on backend startup** from environment variables.

When the backend starts:
1. It checks if an admin with `ADMIN_SEED_EMAIL` already exists.
2. If not, it creates one with `super_admin` role.
3. If it already exists, it skips (safe to restart).

**Local setup:**
```bash
# In apps/backend/.env:
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD=Admin@123456
```

Start the backend → the admin is created on first run.

**Login:** Go to `/admin/login` and use the email/password from your env vars.

---

## Product Flow

### Admin Flow
```
/ (landing)
→ Admin Login (/admin/login)
→ Admin Dashboard (/admin/dashboard)
→ Review Requests (/admin/requests)
→ Accept request → system generates access code
→ Copy and share the code with the user
```

### User Flow
```
/ (landing)
→ Request Access (/user/request)
→ Wait for admin approval
→ Enter Access Code (/user/verify-code)
→ Complete Profile (/user/setup-profile)
→ Enter Messenger (/app/chats)
```

---

## Testing Key Flows

### Test Admin Approval Flow

1. Open http://localhost:3000/user/request
2. Fill in name, email, optional phone/message
3. Submit → "Your request has been sent"
4. Open http://localhost:3000/admin/login in another tab (or incognito)
5. Log in with seeded admin credentials
6. Go to `/admin/requests`
7. Click **Accept** on the request
8. **Copy the access code shown** (it appears once only)
9. Go back to http://localhost:3000/user/verify-code
10. Enter the copied code → redirect to profile setup
11. Complete profile → redirect to `/app/chats`

### Test Direct Chat

1. Log in as two different users (two browser windows / incognito)
2. In Window 1: Go to `/app/chats` → click the search icon → search for the other user
3. Click **Chat** → opens direct conversation
4. Send a message → appears in real-time in Window 2

### Test Group Chat

1. Log in as a user → go to `/app/groups/create`
2. Enter a group name → search and add 2+ users → **Create Group**
3. Open the group conversation → send messages
4. All members see messages in real-time
5. To leave: click Leave (note: owners must transfer ownership first)

### Test Media Upload

1. In any conversation → click the **Paperclip** icon
2. Select an image, video, audio, or document file
3. Wait for upload → message appears with the media

---

## Deployment

### Deploy Backend to Render

1. Push code to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo.
4. Set **Root Directory**: (leave blank — the `render.yaml` handles build path)
5. OR set manually:
   - **Build Command**: `cd apps/backend && npm install -g pnpm && pnpm install && pnpm build`
   - **Start Command**: `cd apps/backend && node dist/main`
   - **Environment**: Node
6. Add all environment variables from the Backend env section above.
7. Deploy.

**Note**: Free Render instances spin down after 15 minutes of inactivity. The first request after sleep can take 30–60 seconds. This is normal for the free tier.

### Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository.
3. Set **Root Directory** to `apps/web`.
4. Framework preset: **Next.js** (auto-detected).
5. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://your-render-backend.onrender.com
   ```
6. Deploy.

**Note**: After deploying the backend to Render, update the Vercel env vars with the real Render URL.

---

## Backend API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /health | — | Health check |
| POST | /admin/auth/login | — | Admin login |
| GET | /admin/auth/me | Admin JWT | Get current admin |
| GET | /admin/dashboard | Admin JWT | Dashboard stats |
| GET | /admin/requests | Admin JWT | List access requests |
| POST | /admin/requests/:id/accept | Admin JWT | Accept + generate code |
| POST | /admin/requests/:id/reject | Admin JWT | Reject request |
| POST | /admin/access-codes/:id/revoke | Admin JWT | Revoke access code |
| GET | /admin/users | Admin JWT | List users |
| PATCH | /admin/users/:id/status | Admin JWT | Update user status |
| GET | /admin/groups | Admin JWT | List groups |
| GET | /admin/audit-logs | Admin JWT | List audit logs |
| POST | /access/request | — | Submit access request |
| POST | /access/verify-code | — | Verify access code |
| POST | /access/setup-profile | — | Create user account |
| POST | /auth/login | — | User login |
| GET | /users/me | User JWT | Get current user |
| GET | /users/search?q= | User JWT | Search users |
| GET | /users/:id | User JWT | Get user by ID |
| POST | /conversations/direct | User JWT | Start/get direct chat |
| POST | /conversations/group | User JWT | Create group |
| GET | /conversations | User JWT | List my conversations |
| GET | /conversations/:id | User JWT | Get conversation + members |
| POST | /groups/:id/members | User JWT | Add members to group |
| DELETE | /groups/:id/members/:userId | User JWT | Remove member |
| POST | /groups/:id/leave | User JWT | Leave group |
| PATCH | /groups/:id/members/:userId/role | User JWT | Update member role |
| GET | /conversations/:id/messages | User JWT | Get messages (paginated) |
| POST | /messages/:id/delivered | User JWT | Mark delivered |
| POST | /messages/:id/read | User JWT | Mark read |
| POST | /media/upload | User JWT | Upload media file |
| GET | /media/:fileId | User JWT | Get media metadata |
| GET | /sync/missed?since= | User JWT | Sync missed messages |

---

## WebSocket Events

**Client → Server:**
- `conversation.join` — join a chat room
- `conversation.leave` — leave a chat room
- `message.send` — send a message
- `message.delivered` — acknowledge delivery
- `message.read` — acknowledge read
- `typing.start` — started typing
- `typing.stop` — stopped typing

**Server → Client:**
- `message.new` — new message for receivers
- `message.sent` — acknowledgement to sender
- `message.delivered` — delivery receipt fan-out
- `message.read` — read receipt fan-out
- `typing.start` — typing indicator fan-out
- `typing.stop` — typing stopped fan-out
- `conversation.created` — new conversation created
- `conversation.updated` — conversation updated
- `group.member.added` — member added to group
- `group.member.removed` — member removed from group
- `group.member.left` — member left group
- `socket.error` — error notification

---

## Free-Tier Limitations

| Limitation | Detail |
|-----------|--------|
| MongoDB Atlas M0 | 512 MB storage, shared cluster, not for production |
| Cloudinary Free | 25 GB storage, 25 GB bandwidth/month |
| Vercel Hobby | Suitable for MVP/personal projects |
| Render Free | Spins down after 15 min inactivity; cold start ~30–60s |
| No Redis | Single Render instance only; Socket.IO won't scale horizontally without Redis adapter |
| No E2EE | Messages stored as plaintext in `encryptedPayload`; E2EE abstraction is in place for future |
| No mobile app | Web only in this phase |
| No offline queue | `pendingQueue` table in IndexedDB is a placeholder |
| No LAN/P2P | Architecture is ready; implementation deferred |
| No calls | Audio/video call support deferred to future phase |

---

## Architecture Notes

### Scaling to Multiple Backend Instances

The current `ConnectionRegistry` (`apps/backend/src/realtime/connection-registry.ts`) is **in-memory**. This means:

- ✅ Works perfectly on a **single Render instance** (free tier)
- ❌ Will break with multiple instances (users on different instances can't reach each other)

**TODO:** When upgrading to paid Render (or any multi-instance setup), replace the in-memory registry with:
```
@socket.io/redis-adapter + ioredis
```
Or use a managed pub/sub service (Upstash Redis, Railway Redis, etc.).

### Encryption

The `encryptedPayload` field and `EncryptionService` abstraction are in place. Currently messages are stored as plaintext. To add E2EE:

1. Implement a real `EncryptionService` (e.g., Signal Protocol, libsodium)
2. Replace the passthrough in messages with encrypted content
3. Key management will require additional infrastructure

### Message Idempotency

Messages use client-generated UUIDs (`messageId`). The backend deduplicates on this field. Safe to retry sends on network failure.

---

## Folder Structure

```
messenger-web/
├── apps/
│   ├── backend/
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── config/
│   │       ├── common/          # Guards, decorators, filters
│   │       ├── schemas/         # All Mongoose schemas
│   │       ├── admin-auth/      # Admin JWT login + seeding
│   │       ├── admin-users/     # Admin user management
│   │       ├── access-requests/ # User access request flow
│   │       ├── access-codes/    # Single-use hashed codes
│   │       ├── auth/            # User auth (verify → setup → login)
│   │       ├── users/           # User search + profile
│   │       ├── conversations/   # Direct + group conversations
│   │       ├── groups/          # Group membership management
│   │       ├── messages/        # Message send + history
│   │       ├── receipts/        # Delivered/read receipts
│   │       ├── media/           # Cloudinary upload
│   │       ├── realtime/        # Socket.IO gateway + registry
│   │       ├── sync/            # Missed message sync
│   │       └── audit-logs/      # Admin action audit trail
│   └── web/
│       ├── app/                 # Next.js App Router pages
│       │   ├── page.tsx         # Landing page
│       │   ├── admin/           # Admin panel pages
│       │   ├── user/            # Onboarding pages
│       │   └── app/             # Messenger app pages
│       └── src/
│           ├── components/      # UI + layout + chat components
│           ├── features/        # Feature-specific components
│           ├── services/        # API + Socket.IO clients
│           ├── stores/          # Zustand state
│           ├── db/              # Dexie/IndexedDB
│           ├── hooks/           # Custom React hooks
│           ├── utils/           # Helpers
│           └── types/           # TypeScript interfaces
├── packages/
│   ├── shared/                  # Socket event constants + shared types
│   └── config/                  # Shared constants
└── docs/
```

---

## Next Recommended Phase

### Phase 2 — Production Hardening
- [ ] Redis adapter for Socket.IO (horizontal scaling)
- [ ] JWT refresh token rotation
- [ ] Rate limiting per user (not just per IP)
- [ ] File virus scanning before Cloudinary upload
- [ ] Message search (MongoDB Atlas Search)
- [ ] Pagination for conversation list
- [ ] Push notifications (web push / FCM)

### Phase 3 — End-to-End Encryption
- [ ] Implement Signal Protocol or libsodium
- [ ] Key exchange flow
- [ ] Per-conversation key management
- [ ] Replace `encryptedPayload` with real ciphertext

### Phase 4 — Mobile App
- [ ] React Native app (Expo)
- [ ] Shared `@messenger/shared` package already compatible
- [ ] Offline queue implementation (using `pendingQueue` in local DB)

### Phase 5 — LAN / Hotspot / P2P
- [ ] mDNS/Bonjour service discovery
- [ ] WebRTC data channels for direct P2P
- [ ] Fallback to server-relayed when P2P unavailable

### Phase 6 — Audio/Video Calls
- [ ] WebRTC with STUN/TURN
- [ ] Call signaling via existing Socket.IO
- [ ] Screen sharing
