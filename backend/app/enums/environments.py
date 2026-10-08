from enum import Enum


# set 3 options for different stages of project building
class AppEnvTypes(Enum):
    PRODUCTION: str = "PRODUCTION"
    DEVELOPMENT: str = "DEVELOPMENT"
    TEST: str = "TEST"
