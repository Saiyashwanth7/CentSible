from fastapi import APIRouter, Depends, HTTPException, status
from app.services.user_services import *
from app.exceptions.user import UserAlreadyExists
from app.schema.user import UserResponse, UserCreate
import app.services.user_services as user_services
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
