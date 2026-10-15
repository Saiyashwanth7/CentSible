## Important points:

- docker, celery worker, celery beat and app ni veru veru terminals lo run cheyyali.
- Celery worker and celery beat must run at all time in separate terminals

## celery worker:

Celery worker workers on the task assigned by the app, while rabbitmq passes the tasks in a queue format.

we use this below command to start the celery worker:

```bash
celery -A app.celery.task_queue worker --loglevel=info --pool=solo
```

(--pool=solo Windows kosam avasaram.)

output lo mana anni tasks ee format lo kanipisthayi:

[tasks]

- task_1
- task_2
- task_3
- task_4

```bash
celery@<username> ready.
```

ani output lo kanipisthe mana celery workers ready ani artham.

## celery beat:

Celery beat works as an alarm. We will set a time, and when the time hits, the beat will work in background to schedule new tasks to the celery worker. In this project, we use the materialize_recurring_expenses function to create new task of sending email to the user regariding the recurring expense and create a new expense record in the expense_table

```bash
celery -A app.celery.task_queue beat --loglevel=info
```

We use the above command in a new terminal to activate the celery beat.
