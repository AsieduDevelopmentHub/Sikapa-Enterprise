# Backend — Sikapa Enterprise

FastAPI backend for product, auth, and order APIs.

## Run locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Database migrations

```bash
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
alembic revision --autogenerate -m "create initial schema"
alembic upgrade head
```

## Testing

```bash
cd backend
.venv\Scripts\activate
pytest
```

## API Structure

- `app/api/v1/auth/`: Authentication endpoints (register, login)
  - `routes.py`: FastAPI router
  - `schemas.py`: Pydantic models
  - `services.py`: Business logic
- `app/api/v1/products/`: Product endpoints (list, get by slug, create)
  - `routes.py`: FastAPI router
  - `schemas.py`: Pydantic models
  - `services.py`: Business logic

## Notes

- Update `DATABASE_URL` in `backend/.env` for PostgreSQL or Supabase.
- The current backend scaffold uses SQLModel for models and can be extended with order, coupon, and review endpoints.
