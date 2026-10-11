from app.db.session import SessionDep
from app.auth.current_user import get_current_user_or_raise_http_error
from fastapi import Depends, HTTPException, Query
from typing import Annotated
from dataclasses import dataclass
from datetime import date
from app.models.users import User
from app.services.expense_services import ExpenseFilters

# Login user details, current user dependency
CurrentUser = Annotated[User, Depends(get_current_user_or_raise_http_error)]


# pagination filters dependency
@dataclass
class Pagination:
    page: int
    page_size: int


def get_pagination(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100)
) -> Pagination:
    return Pagination(page=page, page_size=page_size)


PaginationDep = Annotated[Pagination, Depends(get_pagination)]


# Expense filters Dependency
def get_expense_filters(
    category_id: int | None = Query(None),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    search: str | None = Query(None, max_length=100),
) -> ExpenseFilters:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=422, detail="start_date must be on or before end_date"
        )
    return ExpenseFilters(
        category_id=category_id, start_date=start_date, end_date=end_date, search=search
    )


FiltersDep = Annotated[ExpenseFilters, Depends(get_expense_filters)]


__all__ = ["CurrentUser", "SessionDep", "Pagination", "PaginationDep", "FiltersDep"]
