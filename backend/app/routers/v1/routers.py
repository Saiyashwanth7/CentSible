from app.routers.v1.auth import password_reset, password_auth
from app.routers.v1 import user
from fastapi import APIRouter

router = APIRouter()

router.include_router(user.router, prefix="/user", tags=["user"])
router.include_router(password_auth.router, prefix="/auth", tags=["auth"])
router.include_router(
    password_reset.router, prefix="/auth/password-reset", tags=["password-reset"]
)
