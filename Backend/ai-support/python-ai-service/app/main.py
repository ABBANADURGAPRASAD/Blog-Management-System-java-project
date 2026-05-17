from contextlib import asynccontextmanager

from fastapi import FastAPI
from prometheus_client import make_asgi_app

from app.api.routes import health, moderate
from app.config import settings


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield


app = FastAPI(
    title="AI Content Moderation Service",
    version=settings.model_bundle_version,
    lifespan=lifespan,
)

api = settings.api_prefix
app.include_router(health.router, prefix=api)
app.include_router(moderate.router, prefix=api)

# Prometheus metrics at /metrics
app.mount("/metrics", make_asgi_app())


@app.get("/")
async def root() -> dict:
    return {"service": settings.app_name, "docs": "/docs"}
