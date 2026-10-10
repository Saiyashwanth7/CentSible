from pydantic import BaseModel, Field, field_validator
from datetime import date as Date
from app.enums.frequency import Frequency
from app.schema.common import MoneyIn, ShortText
from app.utils.stats import today_local

"""
    RESPONSE basemodels are used by the APIs, remaining are used in the business logic
"""

# create recurring expense


class RecurringCreate(BaseModel):
    title: ShortText
    amount: MoneyIn
    category_id: int
    notes: str = Field("", max_length=1000)
    frequency: Frequency
    start_date: Date

    @field_validator
    @classmethod
    def not_too_old(cls, v: Date) -> Date:
        if (today_local() - v).days > 366:
            raise ValueError("start_date can be at most one year in the past")
        return v


# update recurring expense


class RecurringUpdate(BaseModel):
    title: ShortText | None = None
    amount: MoneyIn | None = None
    category_id: int | None = None
    notes: str | None = Field("", max_length=1000)
    active: bool | None = None


# recurring response
class RecurringResponse(BaseModel):
    id: int
    title: ShortText
    amount: MoneyIn
    category_id: int
    notes: str = Field("", max_length=1000)
    frequency: Frequency
    next_date: Date
    active: bool

    model_config = {"from_attributes": True}
