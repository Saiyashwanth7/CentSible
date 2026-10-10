from pydantic import BaseModel
from app.schema.common import MoneyOut


# month total
class MonthTotal(BaseModel):
    month: str
    month_total: MoneyOut


# category change -> the trends in a particular category compared to the last month
class CategoryChange(BaseModel):
    category: str
    this_month: MoneyOut
    last_month: MoneyOut
    change_pct: float | None  # -> change in percentage


# trends
class Trends(BaseModel):
    months: list[MonthTotal]
    this_month_total: MoneyOut
    last_month_total: MoneyOut
    change_pct: float | None
    projected_month_total: MoneyOut
    categories: list[CategoryChange]
