# Sikapa Enterprise

Sikapa Enterprise is a modern eCommerce platform for beauty and lifestyle products, including cosmetics, wigs, nails, perfumes, and personal care items. It combines a responsive web storefront, a Python API backend, database schema management, and an Android WebView wrapper.

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLModel
- Database: PostgreSQL / Supabase-compatible schema
- Mobile: Android APK wrapper for the storefront

## Repository Structure

- `frontend/` - Next.js storefront and UI
- `backend/` - FastAPI API server, models, routers, and migration tooling
- `backend/dbschemas/` - SQL schema files
- `backend/migration/` - custom migration helper scripts
- `backend/docs/` - backend documentation, including migration docs
- `android/` - Android wrapper project

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` to view the storefront.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000/docs` for API documentation.

## Configuration

Create and configure environment files:

- `backend/.env` - backend database URL, secrets, and API keys
- `frontend/.env.local` - frontend API base URL and client settings

## Database Setup

The backend stores database schema files in:

- `backend/dbschemas/`

To run migrations:

```bash
cd backend
venv\Scripts\activate
alembic upgrade head
```

For custom migration management, use:

- `backend/migration/manage.py`

## Mobile App

The Android wrapper project is documented in:

- `android/README.md`

It wraps the hosted storefront in a WebView for deployment to Android devices.

## Documentation

**Start here:** [docs/README.md](docs/README.md) — index of all guides (environment, operations, auth, API, hosting).

| Area | Location |
|------|----------|
| Env vars & `SECRET_KEY` | [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) |
| Health, CORS, JWT refresh | [docs/OPERATIONS.md](docs/OPERATIONS.md) |
| Backend setup & migrations | [backend/README.md](backend/README.md) |
| Auth system | [backend/docs/AUTHENTICATION.md](backend/docs/AUTHENTICATION.md) |
| API examples | [backend/docs/API_REFERENCE.md](backend/docs/API_REFERENCE.md) |
| Frontend (Vercel) | [frontend/docs/hosting/vercel.md](frontend/docs/hosting/vercel.md) |
| Backend (Render) | [backend/docs/hosting/render.md](backend/docs/hosting/render.md) |
| DB migrations detail | [backend/docs/migration/migration.md](backend/docs/migration/migration.md) |

## Notes

- Ensure the backend API is running before using the frontend for full functionality.
- Keep environment variables configured correctly for both frontend and backend.
- Use the migration docs and helper scripts when updating database models.
