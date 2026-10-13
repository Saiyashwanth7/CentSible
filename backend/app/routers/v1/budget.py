from app.services import budget_services
from app.routers.dependencies import SessionDep, CurrentUser
from app.schema.budget import BudgetStatus, BudgetUpsert
from fastapi import APIRouter, status

router = APIRouter()


@router.get("", response_model=list[BudgetStatus])
async def get_budgets(user: CurrentUser, session: SessionDep) -> list[BudgetStatus]:
    return await budget_services.list_budget_statuses(user.id, session)


@router.post("", response_model=list[BudgetUpsert])
async def upsert_budget(user: CurrentUser, data: BudgetUpsert, session: SessionDep):
    return await budget_services.upsert_budget(user.id, data, session)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(budget_id: int, user: CurrentUser, session: SessionDep) -> None:
    return await budget_services.delete_budget(budget_id, user.id, session)
