import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path

# Load environment variables from .env file
load_dotenv()

# Get the backend directory path
backend_dir = Path(__file__).parent.parent
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{backend_dir}/db/sikapa.db")

# Configure connection arguments based on database type
connect_args = {}
engine_kwargs = {
    "echo": os.getenv("DEBUG", "false").lower() == "true",
}

if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif DATABASE_URL.startswith("postgresql"):
    # PostgreSQL connection pooling and settings
    engine_kwargs["pool_size"] = 10  # Number of connections to maintain
    engine_kwargs["max_overflow"] = 20  # Maximum overflow connections
    engine_kwargs["pool_pre_ping"] = True  # Test connection before reusing

engine = create_engine(
    DATABASE_URL, 
    connect_args=connect_args,
    **engine_kwargs
)


def create_db_and_tables() -> None:
    """Create all database tables from SQLModel definitions."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency to get database session."""
    with Session(engine) as session:
        yield session
