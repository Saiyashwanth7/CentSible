from pydantic import BaseModel
from decimal import Decimal
from app.schema.common import MoneyIn, MoneyOut
from typing import Literal

# budget update + insert; BudgetUpsert


class BudgetUpsert(BaseModel):
    category_id: int
    monthly_limit: MoneyIn


# budget status


class BudgetStatus(BaseModel):
    id: int
    category_id: int
    category: str
    monthly_limit = MoneyOut
    spent: MoneyOut
    remaining: MoneyOut
    percentage = float
    status = Literal["OK", "WARNING", "OVER"]
