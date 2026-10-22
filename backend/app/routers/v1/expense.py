from fastapi import APIRouter, status, Response
from app.routers.dependencies import CurrentUser, SessionDep, PaginationDep, FiltersDep
from app.services import expense_services
from app.schema.expense import (
    DashboardStats,
    ExpenseCreate,
    ExpenseListResponse,
    ExpenseResponse,
    ExpenseUpdate,
)

router = APIRouter()


# get
@router.get("", response_model=ExpenseListResponse)
async def get_expense(
    user: CurrentUser,
    filters: FiltersDep,
    pagination: PaginationDep,
    session: SessionDep,
):
    items, total = await expense_services.list_expenses(
        user.id, filters, pagination.page, pagination.page_size, session
    )
    return ExpenseListResponse(
        items=[ExpenseResponse.model_validate(e) for e in items],
        total=total,
        pages=pagination.page,
        page_size=pagination.page_size,
    )


# create
@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(data: ExpenseCreate, user: CurrentUser, session: SessionDep):
    return await expense_services.create_expense(data, user.id, session)


# get_dashboard
@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(user: CurrentUser, filters: FiltersDep, session: SessionDep):
    return await expense_services.get_dashboard_stats(user.id, filters, session)


# export_csv
@router.get("/export/csv")
async def export_csv(user: CurrentUser, filters: FiltersDep, session: SessionDep):
    content = await expense_services.export_expenses_csv(user.id, filters, session)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="expenses.csv"'},
    )


# update
@router.put("/{expense_id}", response_model=ExpenseResponse)
async def updated_expense(
    expense_id: int, user: CurrentUser, data: ExpenseUpdate, session: SessionDep
):
    return await expense_services.update_expense(expense_id, user.id, data, session)


# delete
@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(expense_id: int, user: CurrentUser, session: SessionDep):
    await expense_services.delete_expense(expense_id, user.id, session)
