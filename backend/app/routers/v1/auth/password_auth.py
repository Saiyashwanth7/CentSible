from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, status
from fastapi.security import OAuth2PasswordRequestForm
from uuid import uuid4

from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.exceptions.user import UserEmailDoesNotExist, UserIdDoesNotExist
from app.schema.user import UserResponse
from app.services.user_services import get_user_by_email, get_user_by_id
from app.auth.jwt import (
    create_access_token,
    create_refresh_token,
    store_tokens,
    decode_refresh_token,
    store_access_token,
    delete_tokens,
    is_token_issued_before_password_update,
)
from app.auth.password import verify_password
from app.utils.logging import Logger, LogLevel
from app.routers.dependencies import SessionDep

router = APIRouter()


@router.post("/login", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def login(
    response: Response,
    session: SessionDep,
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    email = form_data.username.strip().lower()
    password = form_data.password

    # step 1: extract the user details
    try:
        user = await get_user_by_email(email, session)

    # step 2: verify the email existance
    except UserEmailDoesNotExist:
        Logger.log(
            LogLevel.ERROR, f"A user entered an email {email} which deosn't exists"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user email"
        )

    # step 3: verify the password with the hashed password. This is not the google auth, becuase google auth doesn't need a password, so, in the normal login, the hashed password must never be empty.
    if user.hashed_password is None or not verify_password(
        password, user.hashed_password
    ):
        Logger.log(
            LogLevel.ERROR, f"A user entered an incorrect password for email '{email}'"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
        )

    # create access token and refresh token
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id), "jti": str(uuid4())})

    # store both the tokens in the browser
    store_tokens(response, access_token, refresh_token)
    response.status_code = 200
    return UserResponse.model_validate(user)


@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh(
    response: Response,
    session: SessionDep,
    refresh_token: str = Cookie(None),
):
    # check if the user has loggedin
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be authorized to access.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # decode the refresh token
    try:
        decoded = decode_refresh_token(refresh_token)
    except JWTError as e:
        Logger.log(LogLevel.ERROR, f"A JWT error occured:{e}")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be authorized to access.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # extract the details from the 'decoded'
    sub = decoded.get("sub")

    if sub is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be authorized to access.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user = await get_user_by_id(int(sub), session)
    except (UserIdDoesNotExist, ValueError):
        Logger.log(LogLevel.ERROR, f"User id {sub} from refresh token doesn't exists")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be authorized to access.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if is_token_issued_before_password_update(decoded, user):
        Logger.log(
            LogLevel.ERROR,
            f"Refresh token for user ID `{sub}` was issued before their password was last updated",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be authorized to access.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # after extracting the user id, now, create a new access_token using the details
    access_token = create_access_token(data={"sub": str(user.id)})

    store_access_token(response, access_token)
    response.status_code = 200
    return response


@router.post("/logout")
async def logout(response: Response):
    delete_tokens(response)  # delete tokens from the browser cookies
    response.status_code = 200
    return response
