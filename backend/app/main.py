from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.exceptions.handlers import register_exception_handler
from app.routers.v1 import routers
from app.routers.dependencies import SessionDep

app = FastAPI(title="CentSible API", version="1.0.0")

# Turns domain errors into clean HTTP responses.


def create_app() -> FastAPI:
    _app = FastAPI(**settings.fast_api_kwargs)
    register_exception_handler(_app)
    _app.include_router(routers.router, prefix=settings.api_v1_prefix)
    _app.add_middleware(SessionMiddleware, secret_key=settings.session_secret_key)
    _app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allow_origins,
        allow_credentials=settings.allow_credentials,
        allow_methods=settings.allow_methods,
        allow_headers=settings.allow_headers,
    )
    return _app


app = create_app()


@app.get("/health")
async def health_db(session: SessionDep):
    try:
        await session.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return {"status": "ok"}
