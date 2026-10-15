# Docker database connection using alembic

## alembic setup and env.py modifications

> We are using alembic in this project. Alembic setup starts with the below command:

```bash
alembic init alembic
```

> next, update the env.py variables to link with our database. The 2 main changes are:

#### 1

> config = context.config
>
> from app.core.config import settings
>
> config.set_main_option("sqlalchemy.url", settings.sync_driver_database_url)

#### 2

> from app.db.base import Base
>
> target_metadata = Base.metadata

After setting up the alembic files with the database connectors, we use this below command to generate/update table

```bash
alembic revision --autogenerate -m "message"
```

This will generate tables, but to save those table into the database:

```bash
alembic upgrade head
```

Now, we can start using the database tables. To update any rows/columns or records in the tables, we use the above commands in loop.

# Docker side setup:

Create a postgresql database:

```bash
docker run -d --name centsible-pg -e POSTGRES_USER=dbadmin -e POSTGRES_PASSWORD=password -e POSTGRES_DB=centsible -p 5433:5432 postgres:16
```

```bash
docker ps
```

Use this below command to check if the desired postgres port is free

```bash
netstat -ano | findstr :5432
```
