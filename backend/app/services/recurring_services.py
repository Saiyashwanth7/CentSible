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


# get recurring
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
    if not recurring:
        raise RecurringExpenseDoesNotExist
    return recurring


# list recurring
async def list_recurring(user_id: int, session: AsyncSession) -> list[RecurringExpense]:
    stmt = (
        select(RecurringExpense)
        .where(RecurringExpense.owner_id == user_id)
        .options(selectinload(RecurringExpense.category))
        .order_by(RecurringExpense.next_date)
    )
    return list((await session.scalars(stmt)).all())


# materialize due: this function will take care of creating new expense records for all the recurring expenses of a user or all the users.
# The today and user_id is optional becuase we may use this function for all the users at a time,
async def materialize_due(
    today: date | None, user_id: int | None, session: AsyncSession
) -> int:
    today = today or today_local()
    stmt = (
        select(RecurringExpense)
        .where(RecurringExpense.next_date <= today, RecurringExpense.active.is_(True))
        .with_for_update(
            skip_locked=True
        )  # when multiple celery workers start working on this, we need to flag already advanced record so other workers don't create duplicate expense
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
                    notes=recurring.notes,
                )
            )
            recurring.next_date = advance(
                recurring.next_date, recurring.frequency, recurring.anchor_day
            )
            created += 1
    await session.flush()
    return created


# create recurring
async def create_recurring(
    data: RecurringCreate, user_id: int, session: AsyncSession
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


# update recurring
async def update_recurring(
    data: RecurringUpdate, user_id: int, session: AsyncSession
) -> RecurringExpense:
    recurring = await get_recurring(data.category_id, user_id, session)
    updates = data.model_dump(exclude_unset=True)
    if (
        updates.get("category_id") is not None
    ):  # here usually category_id would be none if the user doesn't want to update the category, but if the user wants to update the category_id, we must check if the category_id belongs to the user_id or not
        await get_category(updates["category_id"], user_id, session)
    # We must make sure the user is not updating an active recurring expense, and we should not allow it, This resume is being used to adjust the next_date is paused recurring expenses, if next_date in a paused update requested recurring expense was in past, then we need to update the next_date based on the frequency of that recurring expense
    resume = updates.get("active") is True and not recurring.active
    apply_updates(recurring, updates, blank_on_none=("notes",))
    if resume:
        today = today_local()
        while recurring.next_date < today:
            recurring.next_date = await advance(
                recurring.next_date, recurring.frequency, recurring.anchor_day
            )
    await session.flush()
    return await get_recurring(recurring.id, user_id, session)


# delete recurring
async def delete_recurring(
    recurring_id: int, user_id: int, session: AsyncSession
) -> None:
    recurring = await get_recurring(recurring_id, user_id, session)
    await session.delete(recurring)
    await session.flush()
