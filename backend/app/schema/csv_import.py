from datetime import date as Date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schema.common import MoneyIn, MoneyOut, ShortText
from app.utils.csv_parsing import parse_amount, parse_date


# import preview row
class ImportPreviewRow(BaseModel):
    title: str
    amount: MoneyOut
    date: Date
    notes: str = ""
    category_id: int
    category: str
    # File = the CSV had a Category column, AI = the model picked it from a receipt
    category_source: Literal["Keyword", "Default", "History", "File", "AI"]
    duplicate: bool
    # the AI wasn't sure (missing date, foreign currency ...); the UI should highlight these
    needs_review: bool = False
    warning: str | None = None
    source_file: str = ""


# a file that couldn't be read; the other files in the same upload still work
class ImportFileError(BaseModel):
    file: str
    message: str


# import preview
class ImportPreview(BaseModel):
    rows: list[ImportPreviewRow]
    skipped: int
    detected_format: str
    errors: list[ImportFileError] = []


# import commit row
class ImportCommitRow(BaseModel):
    title: ShortText
    amount: MoneyIn
    date: Date
    category_id: int
    notes: str = Field(default="", max_length=100)
    force: bool = False


# import commit
class ImportCommit(BaseModel):
    rows: list[ImportCommitRow] = Field(max_length=2000)


# import result
class ImportResult(BaseModel):
    created: int
    skipped_duplicates: int


# what we ask the vision model to return for one receipt (never sent to the client)
class ReceiptFields(BaseModel):
    merchant: str | None = None
    total: Decimal | None = None
    currency: str | None = None
    date: Date | None = None
    category: str | None = None
    notes: str | None = None

    # models return "₹1,234.50", "05/11/2026" or "null" as often as clean values
    @field_validator("total", mode="before")
    @classmethod
    def _lenient_total(cls, v):
        return parse_amount(v) if isinstance(v, str) else v

    @field_validator("date", mode="before")
    @classmethod
    def _lenient_date(cls, v):
        return parse_date(v) if isinstance(v, str) else v

    @field_validator("merchant", "currency", "category", "notes", mode="before")
    @classmethod
    def _blank_is_none(cls, v):
        if isinstance(v, str) and v.strip().lower() in ("", "null", "none", "n/a"):
            return None
        return v
