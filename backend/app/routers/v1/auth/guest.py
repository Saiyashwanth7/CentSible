from app.services import guest_seed, user_services, rate_limit_services
from app.auth.jwt import create_access_token, create_refresh_token, store_tokens
from app.schema.user import UserResponse
from fastapi import APIRouter, status, Request, Response, HTTPException
from app.routers.dependencies import SessionDep

router = APIRouter()


@router.post("/", response_model=UserResponse)
async def guest_login(request: Request, response: Response, session: SessionDep):
    # 1. rate limit by IP (get the IP the same way your login route does)
    ip = request.client.host
    if not await rate_limit_services.check_rate_limit(f"rate:guest:ip:{ip}", 5, 3600):
        raise HTTPException(
            status_code=429,
            detail="Too many demo accounts created, please try again later",
        )

    # 2. create the guest user and its sample data
    user = await user_services.create_guest_user(session)

    # 3. log them in: same token calls and payload as your login route
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    store_tokens(response, access_token, refresh_token)

    return user
