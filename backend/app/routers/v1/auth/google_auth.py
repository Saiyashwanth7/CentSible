import re

from fastapi import APIRouter, Request, status
from starlette.responses import RedirectResponse

from app.core.config import settings
from app.exceptions.user import UserGoogleIdDoesNotExist, UserEmailDoesNotExist
from app.schema.user import UserCreate
from app.services.user_services import (
    get_user_by_google_id,
    create_user_without_password,
    get_user_by_email,
)
from app.auth.jwt import create_access_token, create_refresh_token, store_tokens
from app.utils.logging import Logger, LogLevel
from app.auth.oauth.google_oauth import google_oath
from app.routers.dependencies import SessionDep

router = APIRouter()


def _failure_redirect(reason: str) -> RedirectResponse:
    # send the user back to the login page instead of showing raw JSON
    return RedirectResponse(
        url=f"{settings.frontend_url}/login?error={reason}",
        status_code=status.HTTP_302_FOUND,
    )


def _safe_name(name: str | None, email: str) -> str:
    # UserCreate only allows [A-Za-z0-9._ -], but Google names can contain
    # accents, apostrophes, non-latin letters, etc. Clean it up so signup
    # doesn't fail validation.
    cleaned = re.sub(r"[^A-Za-z0-9._ -]", "", name or "").strip()
    if not cleaned:
        cleaned = re.sub(r"[^A-Za-z0-9._ -]", "", email.split("@")[0]).strip()
    return (cleaned or "User")[:200]


# Both "" and "/" are registered so a trailing slash added/removed by a
# proxy (Vercel rewrite, Render) never triggers a redirect to another host,
# which would lose the OAuth session cookie.
@router.get("", include_in_schema=False)
@router.get("/")
async def auth_google_login(request: Request):
    return await google_oath.authorize_redirect(request, settings.google_redirect_url)


@router.get("/callback")
async def auth_google_callback(request: Request, session: SessionDep):
    try:
        token = await google_oath.authorize_access_token(request)
    except Exception as e:
        # most common causes: mismatching_state (session cookie lost) or
        # redirect_uri mismatch between Google console and GOOGLE_REDIRECT_URL
        Logger.log(
            LogLevel.ERROR,
            f"Google token exchange failed: {type(e).__name__}: {e}",
        )
        return _failure_redirect("google")

    google_user = token.get("userinfo")
    if not google_user or not google_user.get("email"):
        Logger.log(LogLevel.ERROR, "Google did not return userinfo/email")
        return _failure_redirect("google")

    try:
        google_id = google_user["sub"]
        email = google_user["email"].strip().lower()
        name = _safe_name(google_user.get("name"), email)

        try:
            user = await get_user_by_google_id(google_id, session)
        except UserGoogleIdDoesNotExist:
            try:
                user = await get_user_by_email(email, session)
                user.google_id = google_id
                await session.flush()
            except UserEmailDoesNotExist:
                Logger.log(
                    LogLevel.INFO, "Google ID does not exist for user. Creating user."
                )
                user_create = UserCreate(email=email, name=name, google_id=google_id)
                user = await create_user_without_password(user_create, session)

        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})
    except Exception as e:
        Logger.log(
            LogLevel.ERROR,
            f"Google login user handling failed: {type(e).__name__}: {e}",
        )
        return _failure_redirect("google")

    redirect = RedirectResponse(
        url=f"{settings.frontend_url}/auth/callback",
        status_code=status.HTTP_302_FOUND,
    )
    store_tokens(redirect, access_token, refresh_token)
    return redirect
