from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.user import (
    UserAlreadyExists,
    UserIdDoesNotExist,
    UserEmailDoesNotExist,
    UserGoogleIdDoesNotExist,
)
from app.models.users import User
from app.schema.user import UserCreate
from app.auth.password import hash_password
from app.utils.logging import Logger, LogLevel


# get user by id
async def get_user_by_id(id: int, session: AsyncSession) -> User:
    result = await session.execute(select(User).where(User.id == id))
    user = result.scalars().first()
    if not user:
        raise UserIdDoesNotExist
    return user


# get user by email
async def get_user_by_email(email: str, session: AsyncSession) -> User:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        raise UserEmailDoesNotExist
    return user


# get user by google id
async def get_user_by_google_id(google_id: str, session: AsyncSession) -> User:
    result = await session.execute(select(User).where(User.google_id == google_id))
    user = result.scalars().first()
    if not user:
        raise UserGoogleIdDoesNotExist
    return user


# create_user_with_password
async def create_user_with_password(
    user_model: UserCreate, session: AsyncSession
) -> User:
    # extract the email and password details
    email = user_model.email.strip().lower()
    hashed_password = hash_password(user_model.password)

    # check is the email already exists:
    result = await session.execute(select(User).where(User.email == email))
    existing = result.scalars().first()
    if existing:
        raise UserAlreadyExists

    # if user doesn't exist, then add the user details to the db
    user = User(
        email=email,
        hashed_password=hashed_password,
        **user_model.model_dump(exclude={"email", "password", "confirm_password"}),
    )
    session.add(user)
    await session.flush()
    return user


# create user without password - using the google id
async def create_user_without_password(
    user_model: UserCreate, session: AsyncSession
) -> User:
    email = user_model.email.strip().lower()

    # check if the emil already exists:
    result = await session.execute(select(User).where(User.email == email))
    existing = result.scalars().first()
    if existing:
        raise UserAlreadyExists

    # now, save the user excluding the password and confirm password, which remains, cleaned email, and google_id in user_model

    user = User(
        email=email,
        **user_model.model_dump(exclude={"email", "password", "confirm_password"}),
    )
    session.add(user)
    await session.flush()
    return user


# update user password - doesn't need a new basemodel for password request
async def update_user_password(
    user: User, password: str, session: AsyncSession
) -> User:
    user.hashed_password = hash_password(password)
    user.password_updated_at = datetime.now(timezone.utc)
    session.add(user)
    await session.flush()
    return user
