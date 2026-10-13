from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions.recurring import RecurringExpenseDoesNotExist
from app.models.expense import Expense
from app.models.recurring_expense import RecurringExpense
from app.schema.recurring import RecurringCreate, RecurringUpdate
from app.services.category_services import get_category
from app.utils.recurrence import advance
from app.utils.stats import today_local
from app.utils.updates import apply_updates


async def get_recurring(
    recurring_id: int, user_id: int, session: AsyncSession
) -> RecurringExpense:
    stmt = (
        select(RecurringExpense)
        .where(
            RecurringExpense.id == recurring_id, RecurringExpense.owner_id == user_id
        )
        .options(selectinload(RecurringExpense.category))
        .execution_options(populate_existing=True)
    )
    recurring = (await session.scalars(stmt)).first()
    if recurring is None:
        raise RecurringExpenseDoesNotExist
    return recurring


async def list_recurring(user_id: int, session: AsyncSession) -> list[RecurringExpense]:
    stmt = (
        select(RecurringExpense)
        .where(RecurringExpense.owner_id == user_id)
        .options(selectinload(RecurringExpense.category))
        .order_by(RecurringExpense.next_date)
    )
    return list((await session.scalars(stmt)).all())


# Turn every due recurring item into real expenses and move its next_date forward.
# Run this from a scheduled Celery task (user_id=None = all users).
# Safe to run twice: rows are locked, and next_date moves forward in the same transaction.
async def materialize_due(
    session: AsyncSession, user_id: int | None = None, today: date | None = None
) -> int:
    today = today or today_local()
    stmt = (
        select(RecurringExpense)
        .where(RecurringExpense.active.is_(True), RecurringExpense.next_date <= today)
        .with_for_update(skip_locked=True)
    )
    if user_id is not None:
        stmt = stmt.where(RecurringExpense.owner_id == user_id)

    created = 0
    for recurring in (await session.scalars(stmt)).all():
        while recurring.next_date <= today:
            session.add(
                Expense(
                    title=recurring.title,
                    amount=recurring.amount,
                    category_id=recurring.category_id,
                    date=recurring.next_date,
                    notes=recurring.notes or "Recurring",
                    owner_id=recurring.owner_id,
                )
            )
            recurring.next_date = advance(
                recurring.next_date, recurring.frequency, recurring.anchor_day
            )
            created += 1
    await session.flush()
    return created


async def create_recurring(
    user_id: int, data: RecurringCreate, session: AsyncSession
) -> RecurringExpense:
    await get_category(data.category_id, user_id, session)
    recurring = RecurringExpense(
        owner_id=user_id,
        title=data.title,
        amount=data.amount,
        category_id=data.category_id,
        notes=data.notes,
        frequency=data.frequency.value,
        anchor_day=data.start_date.day,
        next_date=data.start_date,
    )
    session.add(recurring)
    await session.flush()
    await materialize_due(
        session, user_id=user_id
    )  # back-fill if the start date is today or past
    return await get_recurring(recurring.id, user_id, session)


async def update_recurring(
    recurring_id: int, user_id: int, data: RecurringUpdate, session: AsyncSession
) -> RecurringExpense:
    recurring = await get_recurring(recurring_id, user_id, session)
    updates = data.model_dump(exclude_unset=True)
    if updates.get("category_id") is not None:
        await get_category(updates["category_id"], user_id, session)

    resuming = updates.get("active") is True and not recurring.active
    apply_updates(recurring, updates, blank_on_none=("notes",))
    if resuming:
        # skip the time it was paused instead of back-filling it
        today = today_local()
        while recurring.next_date < today:
            recurring.next_date = advance(
                recurring.next_date, recurring.frequency, recurring.anchor_day
            )
    await session.flush()
    return await get_recurring(recurring_id, user_id, session)


async def delete_recurring(
    recurring_id: int, user_id: int, session: AsyncSession
) -> None:
    recurring = await get_recurring(recurring_id, user_id, session)
    await session.delete(recurring)
    await session.flush()
