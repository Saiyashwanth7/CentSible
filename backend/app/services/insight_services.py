import calendar
from collections import defaultdict
from datetime import date
from decimal import Decimal

from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.expense import Expense
from app.schema.insights import CategoryChange, MonthTotal, Trends
from app.utils.stats import pct_change, shift_month, today_local

ZERO = Decimal("0.00")
TWO_PLACES = Decimal("0.01")


async def spend_by_month(
    user_id: int, since: date, session: AsyncSession
) -> dict[tuple[int, int], dict[str, Decimal]]:
    year = extract("year", Expense.date)
    month = extract("month", Expense.date)
    # these tqo are sqlalchemy expressions not general variables
    stmt = (
        select(year, month, Category.name, func.sum(Expense.amount))
        .join(Category, Category.id == Expense.category_id)
        .where(Expense.owner_id == user_id)
        .group_by(year, month, Category.name)
    )
    
    result:dict[tuple[int,int],dict[str,Decimal]]=defaultdict(dict)
    for y,m,name,total in (await session.execute(stmt)).all():
        result[(int(y),int(m))].get(name)=Decimal(total)
    
    return result

async def get_trends(user_id:int,months:int,session:AsyncSession)->Trends:
    today = today_local()
    # get last {months} no.of months spend by month dict
    by_month = await spend_by_month(user_id, shift_month(today, -(months - 1)),session)
    month_totals = []
    for offset in range(months-1,-1,-1):
        m = shift_month(today,-offset)
        total = sum(by_month.get((m.year,m.month),{}),ZERO)
        month_totals.append(MonthTotal(month=f"{m.year}-{m.month:02d}",month_total=total))# %02d valla month single digit ayithe leading zero add avtundi.
        
    # till now, we got the all {months} no.of months by month spends and extracted month totals
    # now, we are going to compare current months spends by last month
    last = shift_month(today,-1)
    this_cats = by_month.get((today.year,today.month),{})
    last_cats = by_month.get((last.year,last.month),{})
    this_total = sum(this_cats.values(),ZERO)
    last_total = sum(last_cats.values(),ZERO)
    
    # for now, we are linearly predicting the "by current month"'s total expense
    # simple projection: spend so far / days elapsed * days in month
    days_in_month = calendar.monthrange(today.year,today.month)[1]
    projected = (this_total/today.day * days_in_month).quantize(TWO_PLACES)
    
    categories = [
        CategoryChange(
            category=name,
            this_month=this_cats.get(name, ZERO),
            last_month=this_cats.get(name, ZERO),
            change_pct=pct_change(this_total,last_total)
        ) for name in set(this_cats) | set(last_cats)
    ]
    categories.sort(key=lambda c: -abs(c.this_month - c.last_month))
    return Trends(
        months=month_totals,
        this_month_total=this_total,
        last_month_total=last_total,
        change_pct= pct_change(this_total,last_total),
        projected_month_total=projected,
        categories=categories
    )
    