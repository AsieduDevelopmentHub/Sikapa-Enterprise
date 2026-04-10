import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path

# Load environment variables from .env file
load_dotenv()

# Get the backend directory path
backend_dir = Path(__file__).parent.parent
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{backend_dir}/db/sikapa.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency to get database session."""
    with Session(engine) as session:
        yield session
