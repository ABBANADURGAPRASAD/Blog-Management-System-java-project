from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    return {
        "status": "UP",
        "service": settings.app_name,
        "modelBundle": settings.model_bundle_version,
        "kafkaEnabled": settings.kafka_enabled,
    }
