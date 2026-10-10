from fastapi import FastAPI
from app.routers.v1 import routers

app = FastAPI()

app.include_router(routers.router, prefix="/v1", tags=["v1"])


@app.get("/")
def health_check():
    return {"Status": "Alive"}
