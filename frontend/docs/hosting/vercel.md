# Vercel Deployment for Sikapa Enterprise Frontend

This document explains how to deploy the frontend to Vercel using the `frontend` folder as the project root.

## Deployment setup

1. Go to https://vercel.com and log in.
2. Click **New Project**.
3. Select your Git repository containing this monorepo.
4. When prompted for the project root, choose `frontend`.
5. Verify the framework is detected as **Next.js**.

## Build settings

- **Install Command:** `npm install`
- **Build Command:** `npm run build`
- **Output Directory:** leave blank (Next.js default)

## Environment variables

Add these environment variables in Vercel:

- `NEXT_PUBLIC_API_URL` = `https://your-backend-url.com/api`

If you use Supabase or other external services, also add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> Do not commit production API keys or secrets to Git.

## Local and preview behavior

- `npm run dev` will use `http://localhost:8000/api` from `.env.local`
- Preview deployments will use the `NEXT_PUBLIC_API_URL` value configured in Vercel
- Production deployments will also use the same env var value, or a separate production value

## Recommended workflow

1. Push your frontend branch to GitHub
2. Connect the repo to Vercel
3. Confirm `frontend` is the project root
4. Add `NEXT_PUBLIC_API_URL` and any other public-facing vars
5. Deploy and verify the site on the Vercel URL

## Notes

- Vercel handles HTTPS automatically
- Your frontend should call the Render backend through `NEXT_PUBLIC_API_URL`
- If you change the backend URL, update the Vercel environment variable and redeploy
