# Deploy Frontend Vercel + Backend Railway

## 1. Backend on Railway

1. Open Railway service settings.
2. Make sure Root Directory is `backend`.
3. Make sure Dockerfile path is `Dockerfile`.
4. Attach a Railway PostgreSQL database.
5. Add variables:

```env
DATABASE_URL=<Railway Postgres DATABASE_URL>
DEFAULT_ADMIN_EMAIL=admin@cvscreening.local
DEFAULT_ADMIN_PASSWORD=Admin@123
CORS_ALLOW_ORIGINS=https://my-graduation-thesis.vercel.app,https://my-graduation-thesis-kbkttbvth-sadfatcats-projects.vercel.app
PUBLIC_UPLOAD_BASE_URL=https://<your-railway-backend-domain>
```

6. Deploy and test:

```text
https://<your-railway-backend-domain>/health
```

Expected response:

```json
{"status":"ok"}
```

## 2. Frontend on Vercel

1. Open Vercel project settings.
2. Add Environment Variable:

```env
API_BASE_URL=https://<your-railway-backend-domain>
```

Do not add a trailing slash.

3. Redeploy Vercel after saving the variable.

## 3. How the connection works

Frontend calls relative paths like:

```text
/api/auth/login
/api/jobs
/uploads/...
```

Next.js rewrites these paths to Railway using `API_BASE_URL` in `next.config.ts`.

## 4. Quick checks

Open the Vercel app and test:

1. Candidate login/register.
2. Admin login.
3. Recruiter login at `/recruiter/login`.
4. Recruiter default password flow:
   - password `1` redirects to `/recruiter/change-password`
   - after saving a new password, redirects to `/recruiter_UI`
