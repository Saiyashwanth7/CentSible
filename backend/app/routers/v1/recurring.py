from fastapi import APIRouter, status
from app.routers.dependencies import CurrentUser, SessionDep
from app.services import recurring_services
from app.schema.recurring import RecurringCreate, RecurringResponse, RecurringUpdate

router = APIRouter()


# get_recurring
@router.get("", response_model=list[RecurringResponse])
async def get_recurring(user: CurrentUser, session: SessionDep):
    return await recurring_services.list_recurring(user.id, session)


# create recurring
@router.post("", response_model=RecurringResponse)
async def create_recurring(
    data: RecurringCreate, user: CurrentUser, session: SessionDep
):
    return await recurring_services.create_recurring(user.id, data, session)


# update recurring
@router.patch("/{recurring_id}", response_model=RecurringResponse)
async def update_recurring(
    recurring_id: int, data: RecurringUpdate, user: CurrentUser, session: SessionDep
):
    return await recurring_services.update_recurring(
        recurring_id, user.id, data, session
    )


# delete recurring
@router.delete("/{recurring_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recurring(recurring_id: int, user: CurrentUser, session: SessionDep):
    await recurring_services.delete_recurring(recurring_id, user.id, session)
