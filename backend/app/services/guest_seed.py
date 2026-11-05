from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget import Budget
from app.models.category import Category
from app.models.expense import Expense
from app.models.recurring_expense import RecurringExpense

# (days after the start of the month, title, amount, category)
# Offsets are capped at today, so even on the 2nd of the month every
# "this month" expense is in the past and counts toward this month.
THIS_MONTH = [
    (0, "Rent", "12000", "Housing"),
    (1, "Groceries", "1850", "Food & Dining"),
    (2, "Electricity bill", "1499", "Utilities"),
    (3, "Biryani with friends", "540", "Food & Dining"),
    (4, "Movie tickets", "600", "Entertainment"),
    (5, "Online course", "1100", "Education"),
    (6, "Swiggy dinner", "450", "Food & Dining"),
    (7, "Cab rides", "480", "Travel"),
    (8, "Concert", "900", "Entertainment"),
    (9, "Mobile recharge", "399", "Utilities"),
    (10, "Lunch with colleagues", "620", "Food & Dining"),
    (11, "Bus pass", "600", "Travel"),
    (12, "Cafe", "380", "Food & Dining"),
    (13, "Games", "399", "Entertainment"),
    (14, "Groceries", "1260", "Food & Dining"),
]

# Last month gets the same shape with slightly lower amounts, so the
# dashboard has a month-over-month trend to show.
LAST_MONTH = [
    (0, "Rent", "12000", "Housing"),
    (2, "Groceries", "1700", "Food & Dining"),
    (4, "Electricity bill", "1350", "Utilities"),
    (6, "Swiggy dinner", "520", "Food & Dining"),
    (9, "Movie tickets", "600", "Entertainment"),
    (11, "Mobile recharge", "399", "Utilities"),
    (13, "Lunch with colleagues", "480", "Food & Dining"),
    (16, "Cab rides", "560", "Travel"),
    (19, "Cafe", "350", "Food & Dining"),
    (21, "Biryani with friends", "430", "Food & Dining"),
    (23, "Games", "250", "Entertainment"),
    (25, "Bus pass", "300", "Travel"),
]

# category -> monthly limit. With the data above this gives one budget that
# is fine, one close to its limit and one over it, so the demo shows all three.
BUDGETS = {
    "Utilities": "3000",
    "Food & Dining": "6000",
    "Entertainment": "1500",
}

# (title, amount, category, day of month it repeats on)
RECURRING = [
    ("Rent", "12000", "Housing", 1),
    ("Netflix", "649", "Entertainment", 15),
]


async def seed_guest_data(user_id: int, session: AsyncSession) -> None:
    """Fill a brand-new guest account with realistic sample data.

    It only adds rows and flushes. It does not commit, because get_session
    commits once when the whole request finishes.
    """
    today = date.today()
    month_start = today.replace(day=1)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    next_month_start = (month_start + timedelta(days=32)).replace(day=1)

    # 1. Categories: reuse any the user already has, create the rest.
    wanted = (
        {row[3] for row in THIS_MONTH + LAST_MONTH}
        | set(BUDGETS)
        | {row[2] for row in RECURRING}
    )
    result = await session.execute(select(Category).where(Category.owner_id == user_id))
    categories = {c.name: c for c in result.scalars().all()}
    for name in wanted:
        if name not in categories:
            category = Category(name=name, owner_id=user_id)
            session.add(category)
            categories[name] = category
    await session.flush()  # gives every new category its id

    # 2. Expenses
    rows = []
    for offset, title, amount, cat in THIS_MONTH:
        day = month_start + timedelta(days=min(offset, today.day - 1))
        rows.append((day, title, amount, cat))
    for offset, title, amount, cat in LAST_MONTH:
        rows.append((last_month_start + timedelta(days=offset), title, amount, cat))

    session.add_all(
        Expense(
            title=title,
            amount=Decimal(amount),
            category_id=categories[cat].id,
            date=day,
            notes="",
            owner_id=user_id,
        )
        for day, title, amount, cat in rows
    )

    # 3. Budgets
    session.add_all(
        Budget(
            owner_id=user_id,
            category_id=categories[cat].id,
            monthly_limit=Decimal(limit),
        )
        for cat, limit in BUDGETS.items()
    )

    # 4. Recurring expenses. next_date is next month, so the daily Celery job
    # does not create extra expenses for a guest today.
    session.add_all(
        RecurringExpense(
            owner_id=user_id,
            title=title,
            amount=Decimal(amount),
            category_id=categories[cat].id,
            notes="",
            frequency="monthly",
            anchor_day=anchor,
            next_date=next_month_start.replace(day=anchor),
            active=True,
        )
        for title, amount, cat, anchor in RECURRING
    )

    await session.flush()
