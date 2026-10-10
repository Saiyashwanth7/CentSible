from app.schema.common import MoneyIn, MoneyOut, ShortText
from pydantic import BaseModel, Field
from datetime import date as Date, datetime
from app.schema.category import CategoryResponse

"""
    RESPONSE basemodels are used by the APIs, remaining are used in the business logic
"""


# expense create
class ExpenseCreate(BaseModel):
    title: ShortText
    amount: MoneyIn
    category_id: int
    date: Date
    notes: str = Field(max_length=100)


# expense update
class ExpenseUpdate(BaseModel):
    title: ShortText | None = None
    amount: MoneyIn | None = None
    category_id: int | None = None
    date: Date | None = None
    notes: str | None = Field(max_length=100)


# expense response
class ExpenseResponse(BaseModel):
    id: int
    title: str
    amount: MoneyOut
    category: CategoryResponse
    date: Date
    notes: str | None
    receipt_key: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# expense list response
class ExpenseListResponse(BaseModel):
    items: list[ExpenseResponse]
    total: int
    pages: int
    page_size: int


# category summary
class CategorySummary(BaseModel):
    category_id: int
    category: str
    total: MoneyOut
    count: int


# dashboard stats -> total_spent, total_this_month, category list, total_expense
class DashboardStats(BaseModel):
    total_spent: MoneyOut
    total_this_month: MoneyOut
    total_expenses: MoneyOut
    category_breakdown: list[CategorySummary]
