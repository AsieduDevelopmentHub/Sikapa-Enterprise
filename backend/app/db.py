import os
from sqlmodel import SQLModel, create_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./db/sikapa.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
