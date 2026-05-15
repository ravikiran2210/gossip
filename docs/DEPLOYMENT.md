# Deployment Guide

## Backend → Render Free Web Service

### Option A: Use render.yaml (recommended)

The file `apps/backend/render.yaml` is already configured. Add it to your Render dashboard by connecting your repo.

### Option B: Manual Setup

1. Log in to [render.com](https://render.com)
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `messenger-backend`
   - **Region:** Oregon (or closest to your users)
   - **Branch:** `main`
   - **Build Command:**
     ```
     cd apps/backend && npm install -g pnpm && pnpm install && pnpm build
     ```
   - **Start Command:**
     ```
     cd apps/backend && node dist/main
     ```
   - **Plan:** Free
5. Add environment variables (from `.env.example`)
6. Click **Create Web Service**

### After Deployment

- Backend URL: `https://messenger-backend.onrender.com` (or your custom name)
- Update Vercel env vars:
  ```
  NEXT_PUBLIC_API_URL=https://messenger-backend.onrender.com
  NEXT_PUBLIC_SOCKET_URL=https://messenger-backend.onrender.com
  ```
- Update backend CORS:
  ```
  CORS_ORIGIN=https://your-vercel-app.vercel.app
  FRONTEND_URL=https://your-vercel-app.vercel.app
  ```

---

## Frontend → Vercel Hobby

### Option A: Vercel CLI

```bash
npm install -g vercel
cd apps/web
vercel --prod
```

### Option B: Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set **Root Directory**: `apps/web`
4. Framework: Next.js (auto-detected)
5. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
   ```
6. Click **Deploy**

---

## MongoDB Atlas — Network Access for Render

**Option A: Allow all IPs (easiest for free tier)**
```
Network Access → Add IP → 0.0.0.0/0
```
Note: This allows access from any IP. Use a strong database password.

**Option B: Render Static IPs (paid Render plans)**
- Upgrade to a paid Render plan to get static outbound IPs
- Add those specific IPs to Atlas Network Access

---

## Environment Variable Checklist

### Backend (Render)
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000` (Render assigns this automatically, or leave blank)
- [ ] `MONGODB_URI` — full Atlas connection string
- [ ] `JWT_ACCESS_SECRET` — random 32+ char string
- [ ] `JWT_REFRESH_SECRET` — different random 32+ char string
- [ ] `ADMIN_SEED_EMAIL` — first admin email
- [ ] `ADMIN_SEED_PASSWORD` — first admin password (strong)
- [ ] `ADMIN_SEED_NAME` — first admin display name
- [ ] `ADMIN_SEED_USERNAME` — first admin username
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `CLOUDINARY_UPLOAD_FOLDER=messenger`
- [ ] `FRONTEND_URL` — Vercel deployment URL
- [ ] `CORS_ORIGIN` — Vercel deployment URL

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` — Render backend URL
- [ ] `NEXT_PUBLIC_SOCKET_URL` — Render backend URL

---

## Post-Deployment Checklist

1. Visit `https://your-backend.onrender.com/health` → should return `{ status: "ok" }`
2. Visit `https://your-frontend.vercel.app` → landing page loads
3. Log in as admin at `/admin/login`
4. Create a test access request at `/user/request`
5. Approve and get access code from `/admin/requests`
6. Verify code at `/user/verify-code`
7. Complete profile at `/user/setup-profile`
8. Send a test message

---

## Cold Start Warning

Render free instances sleep after 15 minutes of inactivity.
The first request after sleep takes 30–60 seconds.
- WebSocket connections will fail/timeout during cold start
- Subsequent requests are fast once the instance is warm
- For production use, upgrade to a paid Render plan or add a keep-alive ping

## Keeping the Backend Warm (Optional)

You can use a free external service like [UptimeRobot](https://uptimerobot.com/) to ping `https://your-backend.onrender.com/health` every 5 minutes to prevent cold starts.
