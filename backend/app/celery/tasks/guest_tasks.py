import asyncio
from datetime import datetime, timedelta, timezone

from celery.utils.log import get_task_logger
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.celery.task_queue import celery_task_queue
from app.core.config import settings
from app.db.base import Base  # noqa: F401  (importing it registers every model)
from app.models.users import User

logger = get_task_logger(__name__)

GUEST_LIFETIME_HOURS = 24


async def _delete_expired_guests() -> int:
    """Delete guest users older than 24 hours and return how many were deleted.

    The database cascades (ON DELETE CASCADE) remove each guest's expenses,
    budgets, recurring items and categories, so only the users are deleted here.
    """
    # A throwaway engine with NullPool, like the recurring task: each Celery
    # task run starts its own event loop, and pooled connections from a shared
    # engine are tied to the loop that created them.
    connect_args = {"ssl": "require"} if settings.database_ssl else {}
    engine = create_async_engine(
        settings.async_driver_database_url,
        poolclass=NullPool,
        connect_args=connect_args,
    )
    cutoff = datetime.now(timezone.utc) - timedelta(hours=GUEST_LIFETIME_HOURS)

    try:
        async with AsyncSession(engine) as session:
            result = await session.execute(
                delete(User)
                .where(
                    User.is_guest.is_(True),
                    User.created_at < cutoff,
                    # extra guard: a real user can never match this pattern
                    User.email.like("guest-%@guest.example.com"),
                )
                .returning(User.id)
                .execution_options(synchronize_session=False)
            )
            deleted = len(result.all())
            await session.commit()
            return deleted
    finally:
        await engine.dispose()


@celery_task_queue.task(name="task_cleanup_expired_guests")
def task_cleanup_expired_guests() -> int:
    deleted = asyncio.run(_delete_expired_guests())
    logger.info("Deleted %s expired guest accounts", deleted)
    return deleted
