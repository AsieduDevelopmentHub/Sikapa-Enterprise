# Sikapa Enterprise

A new e-commerce platform for beauty and lifestyle products.

## Architecture

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: FastAPI + SQLModel
- Database: PostgreSQL / Supabase-compatible schema
- Mobile app: Android APK wrapper for the Next.js storefront

## Local setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Notes

- Update `backend/.env` and `frontend/.env.local` with actual environment variables.
- Use `db/schema.sql` to initialize the PostgreSQL / Supabase database.
- The Android wrapper is documented in `android/README.md`.
