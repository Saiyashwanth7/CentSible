import asyncio
import os

import httpx
from celery.utils.log import get_task_logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.celery.task_queue import celery_task_queue
from app.core.config import settings
from app.db.base import Base  # noqa: F401  (importing it registers every model)
from app.enums.receipt import Status
from app.external_services.cloud_storage import storage
from app.external_services.llm.receipt_extractor import extract_receipt_data
from app.models.category import Category
from app.models.receipts import Receipt
from app.schema.receipt import ExtractedReceipt
from app.utils.categorization import FALLBACK_CATEGORY, categorize_by_keywords

logger = get_task_logger(__name__)

IMAGE_MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}

MAX_TITLE_LENGTH = 300  # Expense.title is String(300)

# the user sees this, so it stays generic. The real error goes to the logs.
FAILED_MESSAGE = (
    "We couldn't read this receipt. Please try again or enter the details manually."
)


def _mime_type_from_key(file_key: str) -> str:
    ext = os.path.splitext(file_key)[1].lower()
    return IMAGE_MIME_TYPES.get(ext, "image/jpeg")


def _download_image(file_key: str) -> bytes:
    # blocking, so it is called through asyncio.to_thread
    url = storage.get_receipt_url(file_key)
    response = httpx.get(url, timeout=20)
    response.raise_for_status()
    return response.content


def _clean_title(extracted: ExtractedReceipt) -> None:
    if extracted.title is None:
        return
    title = extracted.title.strip()[:MAX_TITLE_LENGTH]
    extracted.title = title or None


def _resolve_category(extracted: ExtractedReceipt, categories: dict[str, int]) -> None:
    # lowercase name -> (exact name the user has, id)
    lookup = {name.strip().lower(): (name, cid) for name, cid in categories.items()}

    # try these in order: the LLM's pick, then the keyword rules, then "Other"
    candidates = []
    if extracted.category_name:
        candidates.append(extracted.category_name)
    if extracted.title:
        keyword_match = categorize_by_keywords(extracted.title)
        if keyword_match:
            candidates.append(keyword_match)
    candidates.append(FALLBACK_CATEGORY)

    for candidate in candidates:
        match = lookup.get(candidate.strip().lower())
        if match is not None:
            extracted.category_name, extracted.category_id = match
            return

    # the user has none of these categories
    extracted.category_name = None
    extracted.category_id = None


def _make_engine():
    # A throwaway engine with NullPool, like the guest cleanup task: each Celery
    # task run starts its own event loop, so pooled connections can't be shared.
    connect_args = {"ssl": "require"} if settings.database_ssl else {}
    return create_async_engine(
        settings.async_driver_database_url,
        poolclass=NullPool,
        connect_args=connect_args,
    )


async def _save_result(
    engine,
    receipt_id: int,
    status: Status,
    extracted_data: dict | None,
    error_message: str | None,
) -> None:
    async with AsyncSession(engine) as session:
        receipt = await session.scalar(select(Receipt).where(Receipt.id == receipt_id))
        if receipt is None:  # deleted by the user while we were working
            return
        receipt.status = status.value
        receipt.extracted_data = extracted_data
        receipt.error_message = error_message
        await session.commit()


async def _process_receipt(receipt_id: int) -> None:
    engine = _make_engine()
    try:
        # Step 1: claim the receipt and load the user's categories
        async with AsyncSession(engine) as session:
            receipt = await session.scalar(
                select(Receipt).where(Receipt.id == receipt_id)
            )
            if receipt is None:
                return
            # acks_late can run a task twice, so only a pending receipt is claimed
            if receipt.status != Status.PENDING.value:
                return
            receipt.status = Status.PROCESSING.value
            file_key = receipt.file_key

            rows = await session.execute(
                select(Category.name, Category.id).where(
                    Category.owner_id == receipt.owner_id
                )
            )
            categories = {name: cid for name, cid in rows.all()}
            await session.commit()
        # the session is closed here on purpose: the download and the LLM call
        # can take a while, and we must not hold a DB connection during that time

        # Step 2: download the image, extract the data, then clean it
        try:
            image_bytes = await asyncio.to_thread(_download_image, file_key)
            extracted = await asyncio.to_thread(
                extract_receipt_data,
                image_bytes,
                _mime_type_from_key(file_key),
                list(categories),
            )
            _clean_title(extracted)
            _resolve_category(extracted, categories)
        except Exception:
            logger.exception("Receipt %s failed during extraction", receipt_id)
            await _save_result(engine, receipt_id, Status.FAILED, None, FAILED_MESSAGE)
            return

        # Step 3: save the result
        await _save_result(
            engine,
            receipt_id,
            Status.READY,
            extracted.model_dump(mode="json"),
            None,
        )
        logger.info("Receipt %s is ready", receipt_id)
    finally:
        await engine.dispose()


@celery_task_queue.task(name="task_process_receipt")
def task_process_receipt(receipt_id: int) -> None:
    asyncio.run(_process_receipt(receipt_id))
