from pydantic import BaseModel
from datetime import datetime, date
from app.enums.receipt import Status
from decimal import Decimal


class ReceiptResponse(BaseModel):
    id: int
    status: Status
    extracted_data: dict | None = None
    error_message: str | None = None
    expense_id: int | None = None
    created_at: datetime
    model_config = {"from_attributes": True}


class ReceiptUrlResponse(BaseModel):
    url: str


class ExtractedReceipt(BaseModel):
    merchant: str | None
    date: date | None
    total: Decimal | None
    currency: str | None
    category: str | None
