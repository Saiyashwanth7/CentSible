import asyncio

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.celery.task_queue import celery_task_queue
from app.core.config import settings
from app.services.recurring_services import materialize_due
from app.utils.logging import Logger, LogLevel


async def _materialize_all_users() -> int:
    # Celery tasks are plain (sync) functions, so each run starts its own event loop
    # with asyncio.run(). The app's shared engine keeps pooled connections that belong
    # to one loop and would break on the next run, so the task builds a throwaway
    # engine without a pool and disposes of it when done.
    engine = create_async_engine(settings.async_driver_database_url, poolclass=NullPool)
    try:
        session_factory = async_sessionmaker(engine, expire_on_commit=False)
        async with session_factory() as session:
            async with session.begin():  # commits on success, rolls back on error
                return await materialize_due(session)
    finally:
        await engine.dispose()


@celery_task_queue.task(
    name="task_materialize_recurring_expenses",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def task_materialize_recurring_expenses() -> int:
    created = asyncio.run(_materialize_all_users())
    Logger.log(LogLevel.INFO, f"Recurring expenses: created {created} expense(s)")
    return created
