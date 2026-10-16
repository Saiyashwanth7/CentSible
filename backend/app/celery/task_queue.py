from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_task_queue = Celery(
    "worker",
    broker=settings.celery_broker_url,
    include=[
        "app.celery.tasks.email_tasks",
        "app.celery.tasks.recurring_tasks",
    ],
)

celery_task_queue.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
    task_ignore_result=True,
    task_soft_time_limit=100,
    task_time_limit=120,
    timezone="Asia/Kolkata",
    enable_utc=True,
    beat_schedule={
        "materialize-recurring-expenses": {
            "task": "task_materialize_recurring_expenses",
            "schedule": crontab(
                hour=0, minute=10
            ),  # crontab("*"),  -> for testing beat scheduling
        },
    },
)
