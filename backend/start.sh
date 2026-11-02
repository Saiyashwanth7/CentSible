#!/bin/sh
set -e

alembic upgrade head

celery -A app.celery.task_queue:celery_task_queue worker --loglevel=info --concurrency=1 &
celery -A app.celery.task_queue:celery_task_queue beat --loglevel=info -s /tmp/celerybeat-schedule &

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"