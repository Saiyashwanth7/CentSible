from app.routers.v1.auth import password_reset, password_auth
from app.routers.v1 import user, budget, category, expense, insights, recurring
from fastapi import APIRouter

from app.routers.v1.auth import google_auth

router = APIRouter()

# user api
router.include_router(user.router, prefix="/user", tags=["user"])

# core services api
router.include_router(budget.router, prefix="/budget", tags=["budget"])
router.include_router(category.router, prefix="/category", tags=["category"])
router.include_router(expense.router, prefix="/expense", tags=["expense"])
router.include_router(insights.router, prefix="/insights", tags=["insights"])
router.include_router(recurring.router, prefix="/recurring", tags=["recurring"])

# sign-in and login api
router.include_router(google_auth.router, prefix="/auth/google", tags=["google_auth"])
router.include_router(password_auth.router, prefix="/auth", tags=["auth"])
router.include_router(
    password_reset.router, prefix="/auth/password-reset", tags=["password-reset"]
)
