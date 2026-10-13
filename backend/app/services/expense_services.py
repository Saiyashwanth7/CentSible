import csv
import io
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions.expense import ExpenseDoesNotExist
from app.models.category import Category
from app.models.expense import Expense
from app.schema.expense import (
    CategorySummary,
    DashboardStats,
    ExpenseCreate,
    ExpenseUpdate,
)
from app.services.category_services import get_category
from app.utils.stats import shift_month, today_local
from app.utils.updates import apply_updates

ZERO = Decimal("0.00")


@dataclass
class ExpenseFilters:
    category_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    search: str | None = None


def _apply_filters(stmt: Select, filters: ExpenseFilters):
    if filters.category_id is not None:
        stmt = stmt.where(Expense.category_id == filters.category_id)
    if filters.start_date is not None:
        stmt = stmt.where(Expense.date >= filters.start_date)
    if filters.end_date is not None:
        stmt = stmt.where(Expense.date <= filters.end_date)
    if filters.search is not None:
        stmt = stmt.where(Expense.title.icontains(filters.search, autoescape=True))
    return stmt


# get expense


async def get_expense(expense_id: int, user_id: int, session: AsyncSession) -> Expense:
    stmt = (
        select(Expense)
        .where(Expense.id == expense_id, Expense.owner_id == user_id)
        .options(selectinload(Expense.category))
        .execution_options(populate_existing=True)
    )
    expense = (
        await session.scalars(stmt)
    ).first()  # we might fetch multiple expense, so returning the first expense
    if expense is None:
        raise ExpenseDoesNotExist
    return expense


# list expense
async def list_expenses(
    user_id: int,
    filters: ExpenseFilters,
    page: int,
    page_size: int,
    session: AsyncSession,
) -> tuple[list[Expense], int]:
    base = _apply_filters(select(Expense).where(Expense.owner_id == user_id), filters)
    total = await session.scalar(select(func.count()).select_from(base.subquery())) or 0
    stmt = (
        base.options(selectinload(Expense.category))
        .order_by(Expense.date.desc(), Expense.id.desc())
        .limit(page_size)
        .offset((page - 1) * page_size)
    )
    return list((await session.scalars(stmt)).all()), total


# create expense
async def create_expense(
    data: ExpenseCreate, user_id: int, session: AsyncSession
) -> Expense:
    # first check if the user has a category with id as category_id
    await get_category(data.category_id, user_id, session)
    expense = Expense(**data.model_dump(), owner_id=user_id)
    session.add(expense)
    await session.flush()
    return await get_expense(expense.id, user_id, session)


# update expense
async def update_expense(
    expense_id: int, user_id: int, data: ExpenseUpdate, session: AsyncSession
) -> Expense:
    expense = await get_expense(expense_id, user_id, session)
    update = data.model_dump(
        exclude_unset=True
    )  # excludes any empty fileds in the data
    if update.get("category_id") is not None:
        await get_category(update["category_id"], user_id, session)
    apply_updates(expense, update, blank_on_none=("notes",))
    await session.flush()
    return await get_expense(expense_id, user_id, session)


# delete expense
async def delete_expense(expense_id: int, user_id, session: AsyncSession) -> None:
    expense = await get_expense(expense_id, user_id, session)
    # TODO (receipts): also delete expense.receipt_key from R2
    await session.delete(expense)
    await session.flush()


# get_dashboard_stats

"""In this, instead of using python loops and operations to find the total sum, we are using the sql operations"""

"""dashboard stats schema:
    total_spent: MoneyOut
    total_this_month: MoneyOut
    total_expenses: MoneyOut
    category_breakdown: list[CategorySummary]
"""


async def get_dashboard_stats(
    user_id: int, filters: ExpenseFilters, session: AsyncSession
) -> DashboardStats:
    total_amount = func.sum(Expense.amount)
    total_expense_count = func.count(Expense.id)  # these two are sql statements

    breakdown_stmt = (
        _apply_filters(
            select(Category.id, Category.name, total_amount, total_expense_count)
            .join(Category, Category.id == Expense.category_id)
            .where(Expense.owner_id == user_id),
            filters,
        )
        .group_by(Category.id, Category.name)
        .order_by(total_amount.desc())
    )
    rows = (await session.execute(breakdown_stmt)).all()

    today = today_local()
    this_month_stmt = _apply_filters(
        select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.owner_id == user_id,
            Expense.date >= shift_month(today, 0),
            Expense.date < shift_month(today, 1),
        ),
        filters,
    )

    this_month = await session.scalar(this_month_stmt)

    dashboard_stats = DashboardStats(
        total_spent=sum(
            (Decimal(r[2]) for r in rows), ZERO
        ),  # r[2] because total_amount is in the 2nd zeorth index
        total_this_month=Decimal(this_month or 0),
        total_expenses=sum(
            r[3] for r in rows
        ),  # r[3] because total_expense_count is in the 3rd zeorth index
        # Category.id, Category.name, total_amount, total_expense_count
        category_breakdown=[
            CategorySummary(
                category_id=r[0], category=r[1], total=Decimal(r[2]), count=r[3]
            )
            for r in rows
        ],
    )
    return dashboard_stats


# _csv_safe
def _csv_safe(value) -> str:
    text = "" if value is None else value
    return "`" + text if text[:1] in ("=", "+", "-", "@", "\t", "\r") else text


# export expenses csv
async def export_expenses_csv(
    user_id: int, filters: ExpenseFilters, session: AsyncSession
) -> str:
    stmt = (
        _apply_filters(
            select(Expense).where(Expense.owner_id == user_id),
            filters,
        )
        .options(selectinload(Expense.category))
        .order_by(Expense.date.desc(), Expense.id.desc())
    )

    expenses = (await session.scalars(stmt)).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Title", "Amount", "Category", "Date", "Notes"])
    for e in expenses:
        writer.writerow(
            [
                e.id,
                _csv_safe(e.title),
                e.amount,
                _csv_safe(e.category.name if e.category else ""),
                e.date,
                _csv_safe(e.notes),
            ]
        )
    return output.getvalue()
