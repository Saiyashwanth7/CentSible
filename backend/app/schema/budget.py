from typing import Literal

from pydantic import BaseModel

from app.schema.common import MoneyIn, MoneyOut


class BudgetUpsert(BaseModel):
    category_id: int
    monthly_limit: MoneyIn


class BudgetStatus(BaseModel):
    id: int
    category_id: int
    category: str
    monthly_limit: MoneyOut
    spent: MoneyOut
    remaining: MoneyOut
    percent: float
    status: Literal["ok", "warning", "over"]
