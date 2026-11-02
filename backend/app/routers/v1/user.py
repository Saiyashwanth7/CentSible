from fastapi import APIRouter, Depends, HTTPException, status, Response
from app.services.user_services import *
from app.exceptions.user import UserAlreadyExists
from app.schema.user import UserResponse, UserCreate, UserPatch, UserPasswordPatch
import app.services.user_services as user_services
from app.auth.jwt import delete_tokens
from app.auth.password import verify_password
from app.models.users import User
from app.routers.dependencies import CurrentUser, SessionDep
from app.celery.tasks.email_tasks import task_send_welcome_email
from app.utils.logging import Logger, LogLevel
from starlette import status

router = APIRouter()


# my-profile
@router.get("/current", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_data(
    current_user: CurrentUser,
):
    return current_user


# register
@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register(user_create: UserCreate, session: SessionDep):
    try:
        user = await user_services.create_user_with_password(user_create, session)
    except UserAlreadyExists as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    try:
        task_send_welcome_email.delay(user.email, user.name)
    except Exception as e:
        Logger.log(
            LogLevel.ERROR, f"Failed to queue welcome email for '{user.email}': {e}"
        )

    return user


@router.patch("/update", response_model=UserResponse)
async def update_user(
    user_model: UserPatch, current_user: CurrentUser, session: SessionDep
):
    try:
        user = await user_services.get_user_by_id(current_user.id, session)
    except UserIdDoesNotExist as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return await user_services.patch_user_name(current_user.id, user_model, session)


@router.delete("/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    response: Response, current_user: CurrentUser, session: SessionDep
):
    try:
        await user_services.delete_user(current_user.id, session)
    except UserIdDoesNotExist as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    delete_tokens(response)  # same call as your logout route


@router.patch("/password", status_code=status.HTTP_204_NO_CONTENT)
async def patch_user_password(
    response: Response,
    user: CurrentUser,
    passwordRequest: UserPasswordPatch,
    session: SessionDep,
) -> None:

    await user_services.patch_user_password(user.id, passwordRequest, session)
    delete_tokens(response)
