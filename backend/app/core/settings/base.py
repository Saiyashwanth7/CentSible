from pydantic_settings import BaseSettings
from typing import Any
import os

from app.enums.environments import AppEnvTypes


# fallbacks to development mode when APP_ENV is not specified
def get_environment_type() -> AppEnvTypes:
    environment = os.getenv("APP_ENV", "DEVELOPMENT").upper()
    try:
        return AppEnvTypes(environment)
    except ValueError:
        return AppEnvTypes.DEVELOPMENT


class BaseAppSettings(BaseSettings):
    # we need the env type to determine which settings to be used, this will be changed using the SettingsConfigDict
    app_env: AppEnvTypes = get_environment_type()

    # general app details
    api_v1_prefix: str = "/api/v1"
    title: str = "CentSible Backend"
    docs_url: str = "/docs"
    version: str = "1.0.0"

    # cors
    allow_credentials: bool = True
    allow_methods: list[str] = ["*"]
    allow_headers: list[str] = ["*"]
    allowed_hosts: list[str] = ["*"]
    allow_origins: list[str] = ["*"]

    # auth
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30
    jwt_encryption_algorithm: str = "HS256"

    # general settings for a production backend
    debug: bool | None = None
    frontend_url: str | None = None

    access_secret_key: str | None = None
    refresh_secret_key: str | None = None
    session_secret_key: str | None = None

    # google signin
    google_client_secret: str | None = None
    google_client_id: str | None = None

    # DB details
    database_name: str | None = None
    database_host: str | None = None
    database_password: str | None = None
    database_user: str | None = None
    database_port: int = 5432

    # Cloud service settings
    bucket_secret_key: str | None = None
    bucket_access_key_id: str | None = None
    bucket_name: str | None = None
    bucket_region: str | None = None
    bucket_endpoint_url: str | None = None

    # optional settings
    google_redirect_url: str | None = None
    redis_host: str | None = None
    redis_port: int | None = None
    redis_db: int | None = None
    redis_password: str | None = None
    brevo_api_key: str | None = None
    from_email: str | None = None

    # celery
    celery_broker_url: str | None = None

    # @property would just let the user get the function return without calling it (with the "()" brackets)
    @property
    def async_driver_database_url(self) -> str:
        return f"postgresql+asyncpg://{self.database_user}:{self.database_password}@{self.database_host}:{self.database_port}/{self.database_name}"

    @property
    def sync_driver_database_url(self) -> str:
        return f"postgresql+psycopg2://{self.database_user}:{self.database_password}@{self.database_host}:{self.database_port}/{self.database_name}"

    @property
    def fast_api_kwargs(self) -> dict[str, Any]:
        return {
            "debug": self.debug,
            "docs_url": self.docs_url,
            "title": self.title,
            "version": self.version,
        }
