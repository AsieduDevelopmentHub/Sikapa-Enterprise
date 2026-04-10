from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.db import engine
from app.models import User, UserRead


def create_user(email: str, password: str) -> UserRead:
    with Session(engine) as session:
        existing_user = session.exec(select(User).where(User.email == email)).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        user = User(email=email, hashed_password=get_password_hash(password))
        session.add(user)
        session.commit()
        session.refresh(user)
        return user


def authenticate_user(email: str, password: str) -> User:
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        return user