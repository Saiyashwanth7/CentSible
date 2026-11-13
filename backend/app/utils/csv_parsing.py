"""CSV parsing for the importer. Pure functions: no database, no network.

Bank exports differ a lot (HDFC has Withdrawal/Deposit columns, SBI has Debit/
Credit, wallets have one signed Amount column, our own export has Title/Amount/
Category). Header names are matched by synonym, and the header row is searched
for because banks put account details above it. When nothing matches, the
service asks the AI to map the columns and reuses `extract` below.
"""

import csv
import io
import re
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from dateutil import parser as date_parser

MAX_ROWS = 2000  # matches ImportCommit.rows max_length
MAX_TITLE = 200  # DB column is 300, previews stay readable at 200
MAX_NOTES = 100  # ExpenseCreate.notes max_length
MAX_AMOUNT = Decimal("10000000")  # matches MoneyIn
CENT = Decimal("0.01")

DATE_NAMES = [
    "transaction date",
    "txn date",
    "tran date",
    "posting date",
    "date",
    "value date",
    "value dt",
]
DESC_NAMES = [
    "description",
    "narration",
    "particulars",
    "transaction details",
    "transaction remarks",
    "details",
    "merchant",
    "title",
    "name",
    "remarks",
    "payee",
]
AMOUNT_NAMES = ["amount", "transaction amount", "amount inr", "amt"]
DEBIT_NAMES = [
    "debit",
    "debit amount",
    "withdrawal",
    "withdrawal amt",
    "withdrawal amount",
    "withdrawals",
    "dr amount",
]
TYPE_NAMES = ["dr/cr", "cr/dr", "transaction type", "type"]
CATEGORY_NAMES = ["category"]
NOTES_NAMES = ["notes", "note", "memo", "comment"]

_CREDIT_WORD = re.compile(r"\bcr\b|\bcredit\b", re.I)
_DATE_FORMATS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%d.%m.%Y",
    "%d/%m/%y",
    "%d-%m-%y",
    "%d %b %Y",
    "%d-%b-%Y",
    "%d %b %y",
    "%d-%b-%y",
    "%b %d, %Y",
    "%d %B %Y",
]  # day first on purpose: these are Indian statements


@dataclass
class ColumnSpec:
    header_row: int
    date: int
    desc: int
    amount: int | None = None
    debit: int | None = None  # set when money out has its own column
    type_: int | None = None
    category: int | None = None
    notes: int | None = None


@dataclass
class ParsedRow:
    title: str
    amount: Decimal
    date: date
    notes: str = ""
    category: str | None = None  # only when the file has a Category column


@dataclass
class ParsedCsv:
    rows: list[ParsedRow]
    skipped: int
    layout: str
    truncated: bool = False


# ---------- reading ----------
def decode_text(data: bytes) -> str:
    for encoding in ("utf-8-sig", "cp1252"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("latin-1")


def read_rows(data: bytes) -> list[list[str]]:
    text = decode_text(data)
    try:
        dialect = csv.Sniffer().sniff(text[:4096], delimiters=",;\t|")
    except csv.Error:
        dialect = csv.excel
    try:
        return [row for row in csv.reader(io.StringIO(text), dialect)]
    except csv.Error as exc:
        raise ValueError(f"not a readable CSV: {exc}") from None


# ---------- cell parsing ----------
def parse_amount(raw: str) -> Decimal | None:
    s = (raw or "").strip()
    if not s:
        return None
    negative = s.startswith("-") or (s.startswith("(") and s.endswith(")"))
    s = re.sub(r"^[^\d\-(]*", "", s)  # drop leading "Rs.", "₹", "INR " ...
    cleaned = re.sub(r"[^\d.,]", "", s).replace(",", "").strip(".")
    if not cleaned:
        return None
    try:
        value = Decimal(cleaned)
    except InvalidOperation:
        return None
    return -value if negative else value


def parse_date(raw: str) -> date | None:
    s = (raw or "").strip()
    if not s:
        return None
    s = re.sub(r"[ T]\d{1,2}:\d{2}(:\d{2})?.*$", "", s)  # drop a trailing time
    parsed: date | None = None
    for fmt in _DATE_FORMATS:
        try:
            parsed = datetime.strptime(s, fmt).date()
            break
        except ValueError:
            continue
    if parsed is None:
        try:
            parsed = date_parser.parse(s, dayfirst=True).date()
        except (ValueError, OverflowError):
            return None
    return parsed if 2000 <= parsed.year <= 2100 else None


# ---------- header detection ----------
def _norm(header: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9/]+", " ", header.lower())).strip()


def _find(headers: list[str], names: list[str]) -> int | None:
    for name in names:  # exact match first, in priority order
        for i, h in enumerate(headers):
            if h == name:
                return i
    for name in names:
        for i, h in enumerate(headers):
            if len(name) > 3 and h.startswith(name):
                return i
    return None


def detect_columns(rows: list[list[str]]) -> ColumnSpec | None:
    for index, row in enumerate(rows[:40]):
        headers = [_norm(c) for c in row]
        date_col = _find(headers, DATE_NAMES)
        if date_col is None:
            continue
        desc = _find(headers, DESC_NAMES)
        amount = _find(headers, AMOUNT_NAMES)
        debit = _find(headers, DEBIT_NAMES)
        if desc is None or (amount is None and debit is None):
            continue
        return ColumnSpec(
            header_row=index,
            date=date_col,
            desc=desc,
            amount=amount,
            debit=debit,
            type_=_find(headers, TYPE_NAMES),
            category=_find(headers, CATEGORY_NAMES),
            notes=_find(headers, NOTES_NAMES),
        )
    return None


def spec_from_indices(mapping: dict, width: int) -> ColumnSpec | None:
    """Turn an AI column mapping (0-based indices) into a ColumnSpec, or None if unusable."""

    def pick(key: str) -> int | None:
        v = mapping.get(key)
        ok = isinstance(v, int) and not isinstance(v, bool) and 0 <= v < width
        return v if ok else None

    header_row = mapping.get("header_row")
    if not (
        isinstance(header_row, int)
        and not isinstance(header_row, bool)
        and 0 <= header_row < 40
    ):
        header_row = 0
    date_col, desc = pick("date_col"), pick("description_col")
    amount, debit = pick("amount_col"), pick("debit_col")
    if date_col is None or desc is None or (amount is None and debit is None):
        return None
    return ColumnSpec(
        header_row=header_row, date=date_col, desc=desc, amount=amount, debit=debit
    )


# ---------- extraction ----------
def extract(rows: list[list[str]], spec: ColumnSpec) -> ParsedCsv:
    """Turn raw rows into expenses. Income rows and unreadable rows count as skipped."""
    body = rows[spec.header_row + 1 :]

    def cell(row: list[str], i: int | None) -> str:
        return row[i].strip() if i is not None and i < len(row) else ""

    split_columns = spec.debit is not None
    signed = False
    if not split_columns:
        # If the amount column has negatives, negatives are spending and positives are income.
        signed = any(
            (parse_amount(cell(r, spec.amount)) or Decimal(0)) < 0 for r in body
        )

    parsed: list[ParsedRow] = []
    skipped = 0
    for row in body:
        if not any(c.strip() for c in row):
            continue  # blank line, not worth counting
        when = parse_date(cell(row, spec.date))
        title = " ".join(cell(row, spec.desc).split())[:MAX_TITLE]
        if when is None or not title:
            skipped += 1
            continue

        if split_columns:
            amount = parse_amount(cell(row, spec.debit))  # blank for deposits
        else:
            raw = cell(row, spec.amount)
            amount = parse_amount(raw)
            kind = cell(row, spec.type_) if spec.type_ is not None else ""
            if amount is not None and (
                _CREDIT_WORD.search(kind) or _CREDIT_WORD.search(raw)
            ):
                amount = None
            elif amount is not None and signed:
                amount = -amount if amount < 0 else None  # positive = income
        if amount is None:
            skipped += 1
            continue
        try:
            amount = abs(amount).quantize(CENT)
        except InvalidOperation:
            skipped += 1
            continue
        if not (Decimal(0) < amount <= MAX_AMOUNT):
            skipped += 1
            continue

        parsed.append(
            ParsedRow(
                title=title,
                amount=amount,
                date=when,
                notes=cell(row, spec.notes)[:MAX_NOTES],
                category=cell(row, spec.category) or None,
            )
        )

    truncated = len(parsed) > MAX_ROWS
    layout = (
        "debit/credit columns"
        if split_columns
        else "signed amount column" if signed else "amount column"
    )
    return ParsedCsv(
        rows=parsed[:MAX_ROWS], skipped=skipped, layout=layout, truncated=truncated
    )
