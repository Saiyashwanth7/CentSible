from datetime import date as Date
from typing import Literal

from pydantic import BaseModel, Field

from app.schema.common import MoneyIn, MoneyOut, ShortText


# import preview row
class ImportPreviewRow(BaseModel):
    title: str
    amount: MoneyOut
    date: Date
    category_id: int
    category: str
    category_source: Literal["Keyword", "Default", "History"]
    duplicate: bool


# import preview
class ImportPreview(BaseModel):
    rows: list[ImportPreviewRow]
    skipped: int
    detected_format: str


# import commit row
class ImportCommitRow(BaseModel):
    title: ShortText
    amount: MoneyIn
    date: Date
    category_id: int
    force: bool = False


# import commit
class ImportCommit(BaseModel):
    rows: list[ImportCommitRow] = Field(max_length=2000)


# import result
class ImportResult(BaseModel):
    created: int
    skipped_duplicates: int
