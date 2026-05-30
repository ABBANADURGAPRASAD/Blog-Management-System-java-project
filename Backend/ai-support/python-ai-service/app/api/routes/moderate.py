import logging
from typing import Any, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core.moderation_runner import run_media_moderation, run_moderation
from app.core.security import verify_internal_token
from app.models.schemas import (
    AnalyzeRequest,
    ContentType,
    ModerationPayload,
    ModerationResult,
    SyncModerationRequest,
)

router = APIRouter(prefix="/moderate", tags=["moderation"])
log = logging.getLogger(__name__)


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


@router.post("/media", response_model=ModerationResult)
async def moderate_media(
    file: UploadFile = File(...),
    content_type: ContentType = Form(ContentType.POST),
    text: Optional[str] = Form(None),
    user_name: Optional[str] = Form(None),
    language_hint: Optional[str] = Form(None),
    _: dict = Depends(verify_internal_token),
) -> ModerationResult:
    """
    Multipart media check for post create (image/video).
    CNN NSFW + OCR/RNN on embedded text in frames.
    """
    data = await file.read()
    mime = file.content_type or "application/octet-stream"
    try:
        return await run_media_moderation(
            content_type,
            file_bytes=data,
            mime_type=mime,
            text=text,
            user_name=user_name,
            language_hint=language_hint,
        )
    except Exception as exc:
        log.exception("Media moderation failed for %s (%s bytes)", mime, len(data))
        raise HTTPException(
            status_code=500,
            detail=f"Media moderation error: {exc}",
        ) from exc


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
