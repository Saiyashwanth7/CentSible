from pydantic import BaseModel
import datetime as dt
from app.enums.receipt import Status
from decimal import Decimal


class ReceiptResponse(BaseModel):
    id: int
    status: Status
    extracted_data: dict | None = None
    error_message: str | None = None
    expense_id: int | None = None
    created_at: dt.datetime
    model_config = {"from_attributes": True}


class ReceiptUrlResponse(BaseModel):
    url: str


class ExtractedReceipt(BaseModel):
    title: str | None = None
    amount: Decimal | None = None
    date: dt.date | None = None
    category_name: str | None = None
    category_id: int | None = None
