from fastapi import APIRouter

from app.api.v1.auth.schemas import LoginRequest, RegisterRequest, TokenResponse
from app.api.v1.auth.services import authenticate_user, create_user
from app.core.security import create_access_token
from app.models import UserRead

router = APIRouter()


@router.post("/register", response_model=UserRead)
def register(data: RegisterRequest):
    return create_user(data.email, data.password)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest):
    user = authenticate_user(data.email, data.password)
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}