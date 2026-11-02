from app.core.settings.base import BaseAppSettings


class ProductionSettings(BaseAppSettings):
    debug: bool = False

    # Nothing is allowed by default. The real values come from Render
    # environment variables (ALLOW_ORIGINS, FRONTEND_URL, GOOGLE_REDIRECT_URL).
    allow_origins: list[str] = []
