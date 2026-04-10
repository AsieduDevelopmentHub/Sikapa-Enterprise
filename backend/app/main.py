from fastapi import FastAPI
from app.api.v1.routes import router as api_v1_router
from app.db import create_db_and_tables

app = FastAPI(
    title="Sikapa Enterprise API",
    description="Core API for product browsing, authentication, and orders.",
    version="0.1.0",
)

app.include_router(api_v1_router, prefix="/api/v1")


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()


@app.get("/")
def root() -> dict:
    return {"status": "ok", "message": "Sikapa Enterprise backend is running."}
