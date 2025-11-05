# Deployment Guide (Frontend on Vercel, Backend on a Host, DB on MongoDB Atlas)

This project is already configured for deployment:
- Frontend reads API base from `REACT_APP_API_URL`.
- Backend CORS allows your Vercel origin via `CLIENT_ORIGIN`.
- Debug route is disabled in production.

Follow the steps below in order.

## 1) Create your MongoDB Atlas database
1. Go to https://www.mongodb.com/atlas and create a free account (or log in).
2. Create a Free Tier cluster (M0).
3. Database Access: Create a DB user (username + strong password). Save these.
4. Network Access: Add your server/IPs. For quick start: allow access from anywhere (0.0.0.0/0). You can restrict later.
5. Get your connection string:
   - Click Connect → Drivers.
   - Copy the SRV connection string, e.g.
     `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/wealthify?retryWrites=true&w=majority&appName=<clusterName>`
   - Replace `<username>` / `<password>` and set the database name to `wealthify` (or your choice).

## 2) Deploy the backend (Railway)
You can use any host (Render, Railway, Fly, Heroku). This section covers Railway specifically.

1. Push your repo to GitHub if not already.
2. Go to https://railway.app → New Project → Deploy from GitHub repo.
3. Monorepo setup: set Root Directory to `backend` (so Railway builds the right folder).
4. Build & Start (Railway usually auto-detects):
  - Build command: `npm install`
  - Start command: `npm start`
5. Variables → Add environment variables:
  - `MONGODB_URI` = your Atlas connection string
  - `JWT_SECRET` = a long random string
  - `CLIENT_ORIGIN` = your Vercel frontend URL (e.g. `https://your-project.vercel.app`)
  - `NODE_ENV` = `production`
6. Deploy. After deploy, copy the public URL (e.g. `https://wealthify-backend.up.railway.app`).

Notes:
- Railway provides a `PORT` env var automatically; your server uses it.
- You can add a custom domain in Railway later if you want.

## 3) Deploy the frontend (Vercel)
1. Go to https://vercel.com → New Project → Import the GitHub repo.
2. Set the project root to `frontend`.
3. Build settings: defaults work for Create React App.
4. Environment variable:
  - `REACT_APP_API_URL` = `https://<your-railway-backend-domain>/api`
5. Deploy. After deploy, you’ll get `https://<your-frontend>.vercel.app`.

## 4) Smoke-test production
1. Open your Vercel URL.
2. Sign up a new user → expect success.
3. Log in with the same user → expect success.
4. In Atlas → Collections → confirm a document appears in the `users` collection.

## Troubleshooting
- CORS error in browser console:
  - Ensure `CLIENT_ORIGIN` on the backend exactly matches your Vercel URL (scheme + domain).
- 500 Server error on signup/login:
  - Check `MONGODB_URI` and Atlas Network Access (IP allowlist).
- Empty/invalid token behavior:
  - Make sure `JWT_SECRET` is set in the backend env.
- Frontend still calling localhost:
  - Verify `REACT_APP_API_URL` is set in Vercel and redeploy (CRA inlines env at build time).

## Optional: Production healthcheck
You can add `/api/health` to the backend for uptime checks. Example:

```js
app.get('/api/health', (req, res) => res.json({ ok: true }));
```

That’s it — once the three configs (Atlas, backend host, Vercel) are set, your app is live.