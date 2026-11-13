from uuid import uuid4

from fastapi import UploadFile
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums.receipt import Status
from app.exceptions.receipt import (
    InvalidReceiptFile,
    ReceiptAlreadyConfirmed,
    ReceiptDoesNotExist,
    ReceiptTooLarge,
)
from app.external_services.cloud_storage import storage
from app.models.expense import Expense
from app.models.receipts import Receipt
from app.schema.expense import ExpenseCreate
from app.utils.logging import Logger, LogLevel

MAX_RECEIPT_SIZE = 5 * 1024 * 1024  # 5 MB


async def get_receipt_by_id(
    receipt_id: int, user_id: int, session: AsyncSession
) -> Receipt:
    stmt = select(Receipt).where(Receipt.id == receipt_id, Receipt.owner_id == user_id)
    receipt = await session.scalar(stmt)
    if receipt is None:
        raise ReceiptDoesNotExist
    return receipt


async def list_receipts(
    user_id: int,
    session: AsyncSession,
    status: Status | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[Receipt]:
    stmt = select(Receipt).where(Receipt.owner_id == user_id)
    if status:
        stmt = stmt.where(Receipt.status == status.value)
    stmt = (
        stmt.order_by(Receipt.created_at.desc(), Receipt.id.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await session.scalars(stmt)
    return list(result)


def _detect_image_type(header: bytes) -> tuple[str, str] | None:
    """Returns (extension, mime type) from the file's first bytes, or None."""
    if header.startswith(b"\xff\xd8\xff"):  # JPEG: FF D8 FF
        return ".jpg", "image/jpeg"
    if header.startswith(b"\x89PNG"):  # PNG: 89 50 4E 47
        return ".png", "image/png"
    if header[0:4] == b"RIFF" and header[8:12] == b"WEBP":  # WebP
        return ".webp", "image/webp"
    return None


async def create_receipt(
    file: UploadFile, user_id: int, session: AsyncSession
) -> Receipt:
    # 1. type check from the real bytes, never from file.content_type or the filename
    header = file.file.read(12)
    file.file.seek(0)
    detected = _detect_image_type(header)
    if detected is None:
        raise InvalidReceiptFile
    ext, content_type = detected

    # 2. size check
    file.file.seek(0, 2)  # jump to the end
    size = file.file.tell()
    file.file.seek(0)  # back to the start, or the upload would send an empty file
    if size > MAX_RECEIPT_SIZE:
        raise ReceiptTooLarge

    # 3. key
    key = f"receipts/{user_id}/{uuid4()}{ext}"

    # 4. DB row first (no commit, get_session does that)
    receipt = Receipt(owner_id=user_id, file_key=key, status=Status.PENDING.value)
    session.add(receipt)
    await session.flush()

    # 5. upload in a thread, because the storage client is blocking
    await run_in_threadpool(storage.upload_receipt, file.file, key, content_type)

    return receipt


async def get_receipt_image_url(
    receipt_id: int, user_id: int, session: AsyncSession
) -> str:
    receipt = await get_receipt_by_id(receipt_id, user_id, session)
    return storage.get_receipt_url(receipt.file_key)


async def _remove_receipt(receipt: Receipt, session: AsyncSession) -> None:
    key = receipt.file_key
    await session.delete(receipt)
    await session.flush()
    # DB is the source of truth, so a storage failure must not block the delete
    try:
        await run_in_threadpool(storage.delete_receipt, key)
    except Exception:
        Logger.log(LogLevel.ERROR, f"Failed to delete receipt file {key}")


async def delete_receipt_by_id(
    receipt_id: int, user_id: int, session: AsyncSession
) -> None:
    receipt = await get_receipt_by_id(receipt_id, user_id, session)
    await _remove_receipt(receipt, session)


async def delete_receipt_files(keys: list[str]) -> None:
    for key in keys:
        try:
            await run_in_threadpool(storage.delete_receipt, key)
        except Exception:
            Logger.log(LogLevel.ERROR, f"Failed to delete receipt file {key}")


async def delete_receipt_by_key(
    receipt_key: str, user_id: int, session: AsyncSession
) -> None:
    stmt = select(Receipt).where(
        Receipt.file_key == receipt_key, Receipt.owner_id == user_id
    )
    receipt = await session.scalar(stmt)
    if receipt is None:
        return
    await _remove_receipt(receipt, session)


async def confirm_receipt(
    receipt_id: int, user_id: int, expense_data: ExpenseCreate, session: AsyncSession
) -> Expense:
    # imported here because expense_services also imports this module
    from app.services.expense_services import create_expense

    receipt = await get_receipt_by_id(receipt_id, user_id, session)
    if receipt.status == Status.CONFIRMED.value:
        raise ReceiptAlreadyConfirmed

    expense = await create_expense(expense_data, user_id, session)

    # link both sides, so deleting the expense also deletes the receipt
    expense.receipt_key = receipt.file_key
    receipt.expense_id = expense.id
    receipt.status = Status.CONFIRMED.value
    await session.flush()
    return expense
