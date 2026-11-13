from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.user import (
    UserAlreadyExists,
    UserIdDoesNotExist,
    UserEmailDoesNotExist,
    UserGoogleIdDoesNotExist,
)
from app.models.users import User
from app.schema.user import UserCreate, UserPatch, UserPasswordPatch
from app.auth.password import hash_password, verify_password
from app.utils.logging import Logger, LogLevel
from app.services.category_services import seed_default_categories
from app.services.guest_seed import seed_guest_data
from app.models.receipts import Receipt
from app.services.receipt_services import delete_receipt_files
import secrets


# get user by id
async def get_user_by_id(id: int, session: AsyncSession) -> User:
    result = await session.execute(select(User).where(User.id == id))
    user = result.scalars().first()
    if not user:
        raise UserIdDoesNotExist(id)
    return user


# get user by email
async def get_user_by_email(email: str, session: AsyncSession) -> User:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        raise UserEmailDoesNotExist(email)
    return user


# get user by google id
async def get_user_by_google_id(google_id: str, session: AsyncSession) -> User:
    result = await session.execute(select(User).where(User.google_id == google_id))
    user = result.scalars().first()
    if not user:
        raise UserGoogleIdDoesNotExist()
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
        raise UserAlreadyExists(email)

    # if user doesn't exist, then add the user details to the db
    user = User(
        email=email,
        hashed_password=hashed_password,
        **user_model.model_dump(
            exclude={"email", "password", "confirm_password", "google_id"}
        ),
    )

    session.add(user)
    await session.flush()
    await seed_default_categories(user.id, session)
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
        raise UserAlreadyExists(email)

    # now, save the user excluding the password and confirm password, which remains, cleaned email, and google_id in user_model

    user = User(
        email=email,
        **user_model.model_dump(exclude={"email", "password", "confirm_password"}),
    )  # remains only google auth id
    session.add(user)
    await session.flush()
    await seed_default_categories(user.id, session)
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


async def patch_user_name(id: int, user: UserPatch, session: AsyncSession) -> User:
    current_user = await get_user_by_id(id, session)
    current_user.name = user.name
    session.add(current_user)
    await session.flush()
    return await get_user_by_id(id, session)


async def delete_user(id: int, session: AsyncSession) -> None:
    user = await get_user_by_id(id, session)
    stmt = select(Receipt.file_key).where(Receipt.owner_id == id)
    keys = list(await session.scalars(stmt))
    await session.delete(user)
    await session.flush()
    await delete_receipt_files(keys)


async def patch_user_password(
    user_id: int, passwordRequest: UserPasswordPatch, session: AsyncSession
) -> None:
    user = await get_user_by_id(user_id, session)

    if user.hashed_password is None:
        raise HTTPException(
            status_code=400,
            detail="This account has no password yet, use Set password",
        )
    if not verify_password(passwordRequest.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.hashed_password = hash_password(passwordRequest.password)
    user.password_updated_at = datetime.now(timezone.utc)
    await session.flush()


async def create_guest_user(session: AsyncSession) -> User:
    user = User(
        email=f"guest-{secrets.token_hex(8)}@guest.example.com",
        name="Guest",
        hashed_password=None,
        is_guest=True,
    )
    session.add(user)
    await session.flush()  # gives the user its id
    # if your register flow seeds starter categories, call that function here
    await seed_guest_data(user.id, session)
    return user
