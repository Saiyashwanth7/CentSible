from app.enums.environments import AppEnvTypes
from app.core.settings.base import BaseAppSettings
from app.core.settings.development import DevelopmentSettings
from app.core.settings.production import ProductionSettings
from app.core.settings.test import TestSettings

environments: dict[AppEnvTypes, type[BaseAppSettings]] = {
    AppEnvTypes.PRODUCTION: ProductionSettings,
    AppEnvTypes.DEVELOPMENT: DevelopmentSettings,
    AppEnvTypes.TEST: TestSettings,
}


# this function would get the current OS's stage name from the .env or .env.test in the development/testing respectively
# In the production stage, we give the secret keys (like APP_ENV) directly to the hosting service, that itself acts as the env file
def get_app_settings() -> BaseAppSettings:
    app_env = BaseAppSettings().app_env
    environment_settings = environments[app_env]
    return environment_settings()


settings = get_app_settings()
