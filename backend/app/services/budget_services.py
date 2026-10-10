from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions.budget import BudgetDoesNotExist
from app.models.budget import Budget
from app.models.expense import Expense
from app.schema.budget import BudgetStatus, BudgetUpsert
from app.services.category_services import get_category
from app.utils.stats import shift_month, today_local

WARNING_THRESHOLD = Decimal("80")
TWO_PLACES = Decimal("0.01")


# _build_status
def _build_status(budget: Budget, spent: Decimal) -> BudgetStatus:
    spent = Decimal(spent).quantize(TWO_PLACES)
    limit = budget.monthly_limit
    percent = (spent / limit) * 100
    if spent > limit:
        status = "OVER"
    elif percent > WARNING_THRESHOLD:
        status = "WARNING"
    elif percent <= WARNING_THRESHOLD:
        status = "OK"
    return BudgetStatus(
        id=budget.id,
        category_id=budget.category_id,
        category=budget.category.name,
        monthly_limit=limit,
        spent=spent,
        remaining=limit - spent,
        percent=round(float(percent), 1),
        status=status,
    )


# list budget statuses
async def list_budget_statuses(
    user_id: int, session: AsyncSession
) -> list[BudgetStatus]:

    today = today_local()
    spent_rows = await session.execute(
        select(Expense.category_id, func.sum(Expense.amount))
        .where(
            Expense.owner_id == user_id,
            Expense.date >= shift_month(today, 0),
            Expense.date < shift_month(today, 1),
        )
        .group_by(Expense.category_id)
    )
    spent_by_category = {category_id: total for category_id, total in spent_rows.all()}
    budgets = (
        await session.scalars(
            select(Budget)
            .where(Budget.owner_id == user_id)
            .options(selectinload(Budget.category))
        )
    ).all()

    statuses = [
        _build_status(b, spent_by_category.get(b.category_id, Decimal("0")))
        for b in budgets
    ]
    return sorted(statuses, key=lambda s: -s.percent)


# create/update budgest
async def upsert_budget(
    user_id: int, data: BudgetUpsert, session: AsyncSession
) -> Budget:
    await get_category(data.category_id, user_id, session)
    budget = await session.scalar(
        select(Budget).where(
            Budget.owner_id == user_id, Budget.category_id == data.category_id
        )
    )
    if budget:
        budget.monthly_limit = data.monthly_limit
    else:
        session.add(
            Budget(
                owner_id=user_id,
                category_id=data.category_id,
                monthly_limit=data.monthly_limit,
            )
        )
    await session.flush()
    return await list_budget_statuses(user_id, session)


# delete budget
async def delete_budget(budget_id: int, user_id: int, session: AsyncSession) -> None:
    budget = await session.scalar(
        select(Budget).where(Budget.id == budget_id, Budget.owner_id == user_id)
    )
    if not budget:
        raise BudgetDoesNotExist
    await session.delete(budget)
    await session.flush()
