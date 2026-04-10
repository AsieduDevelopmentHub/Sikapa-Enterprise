# Render Deployment for Sikapa Enterprise Backend

This document describes how to deploy the backend to Render using the existing `backend/Dockerfile`.

## What Render does

- Render will build the backend container from `backend/Dockerfile`
- Render will expose the service publically over HTTPS
- The app should listen on the port provided by Render via the `PORT` environment variable
- TLS is terminated by Render, so the app can run on HTTP internally

## Files used for Render

- `render.yaml` (repo root)
- `backend/Dockerfile`
- `backend/.dockerignore`

## Backend settings for Render

Render should use the following service configuration:

- Type: `Web Service`
- Environment: `Docker`
- Dockerfile Path: `backend/Dockerfile`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Auto deploy from branch: `main` (or your deploy branch)

## Environment variables

Add these variables in Render Dashboard:

- `DATABASE_URL`
- `SECRET_KEY`
- `CORS_ORIGINS`
- `CORS_ALLOW_CREDENTIALS`
- `HTTPS_ENABLED=false`  # Render terminates TLS

### Optional
- `HTTP_PORT=8000`
- `HTTPS_PORT=8443`

## Local TLS vs Render TLS

- Use `tools/tls/start_secure.py` for local HTTPS testing
- Do not use local certificate files on Render
- On Render, TLS is managed by the platform, not by `certs/`

## Notes

- Keep `backend/.env.production` out of git
- Use Render Dashboard or secret store for production credentials
- For database migration, run Alembic locally or through a separate Render job if needed
