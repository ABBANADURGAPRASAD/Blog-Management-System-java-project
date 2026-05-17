from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends

from app.core.moderation_runner import run_moderation
from app.core.security import verify_internal_token
from app.models.schemas import (
    AnalyzeRequest,
    ContentType,
    ModerationPayload,
    ModerationResult,
    SyncModerationRequest,
)

router = APIRouter(prefix="/moderate", tags=["moderation"])


@router.post("/sync", response_model=ModerationResult)
async def moderate_sync(
    body: SyncModerationRequest,
    _: dict = Depends(verify_internal_token),
) -> ModerationResult:
    payload = ModerationPayload(
        text=body.text,
        userName=body.user_name,
    )
    return await run_moderation(
        body.content_type,
        payload,
        language_hint=body.language_hint,
    )


@router.post("/analyze", response_model=ModerationResult)
async def moderate_analyze(
    body: AnalyzeRequest,
    _: dict = Depends(verify_internal_token),
) -> ModerationResult:
    return await run_moderation(body.content_type, body.payload)


@router.post("/batch")
async def moderate_batch(
    items: list[SyncModerationRequest],
    _: dict = Depends(verify_internal_token),
) -> dict[str, Any]:
    results = []
    for item in items:
        payload = ModerationPayload(text=item.text, userName=item.user_name)
        r = await run_moderation(item.content_type, payload, language_hint=item.language_hint)
        results.append(r.model_dump())
    return {"count": len(results), "results": results}
