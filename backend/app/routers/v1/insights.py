from fastapi import APIRouter, status, Query
from app.routers.dependencies import CurrentUser, SessionDep
from app.schema.insights import Trends, MonthTotal
from app.services import insight_services

router = APIRouter()


@router.get("/trends", response_model=Trends)
async def get_trends(
    user: CurrentUser, session: SessionDep, months: int = Query(6, ge=2, le=24)
):
    return await insight_services.get_trends(user.id, months, session)
