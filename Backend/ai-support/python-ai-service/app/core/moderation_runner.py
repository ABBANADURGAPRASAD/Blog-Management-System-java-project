"""
Orchestrates text, image, and video pipelines for a single moderation request.
"""

import time
from typing import Optional

import httpx

from app.config import settings
from app.core.decision_engine import aggregate_decision
from app.models.schemas import ContentType, LabelScore, ModerationPayload, ModerationResult
from app.pipelines.image_pipeline import analyze_image, analyze_image_bytes
from app.pipelines.text_pipeline import analyze_text
from app.pipelines.video_pipeline import (
    analyze_video_bytes,
    analyze_video_from_bytes_stub,
    analyze_video_from_url,
)


def _is_comment(content_type: ContentType) -> bool:
    return content_type in (ContentType.COMMENT, ContentType.CHAT, ContentType.ANONYMOUS_CHAT)


async def run_moderation(
    content_type: ContentType,
    payload: ModerationPayload,
    *,
    language_hint: Optional[str] = None,
) -> ModerationResult:
    start = time.perf_counter()
    all_scores = []
    detected_lang: Optional[str] = None

    text_parts = [
        payload.title or "",
        payload.text or "",
        payload.bio or "",
        " ".join(payload.hashtags),
    ]
    text_blob = "\n".join(p for p in text_parts if p).strip()

    if text_blob or payload.user_name:
        text_scores, detected_lang = analyze_text(
            text_blob,
            language_hint=language_hint,
            user_name=payload.user_name,
        )
        all_scores.extend(text_scores)

    async with httpx.AsyncClient(timeout=60.0) as client:
        for item in payload.media:
            if item.media_type == "image" or item.url.endswith((".jpg", ".jpeg", ".png", ".webp")):
                img_scores = await analyze_image(item.url, client=client)
                all_scores.extend(img_scores)
            elif item.media_type == "video" or item.url.endswith((".mp4", ".webm", ".mov")):
                vid_scores, _ = await analyze_video_from_url(item.url)
                all_scores.extend(vid_scores)

    result = aggregate_decision(all_scores, is_comment=_is_comment(content_type))
    result.detected_language = detected_lang
    result.processing_ms = int((time.perf_counter() - start) * 1000)
    result.degraded_mode = settings.model_bundle_version.endswith("-dev")
    return result


async def run_media_moderation(
    content_type: ContentType,
    *,
    file_bytes: bytes,
    mime_type: str,
    text: Optional[str] = None,
    user_name: Optional[str] = None,
    language_hint: Optional[str] = None,
) -> ModerationResult:
    """Sync path for multipart uploads from Spring Boot (post create)."""
    start = time.perf_counter()
    all_scores: list = []

    text_blob = (text or "").strip()
    if text_blob or user_name:
        text_scores, detected_lang = analyze_text(
            text_blob, language_hint=language_hint, user_name=user_name
        )
        all_scores.extend(text_scores)
    else:
        detected_lang = None

    mime = (mime_type or "").lower()
    if mime.startswith("image/"):
        all_scores.extend(analyze_image_bytes(file_bytes, user_name=user_name))
    elif mime.startswith("video/"):
        try:
            vid_scores, _ = await analyze_video_bytes(
                file_bytes, user_name=user_name, content_type_hint=mime
            )
            all_scores.extend(vid_scores)
        except Exception:
            all_scores.extend(await analyze_video_from_bytes_stub(file_bytes))
    elif mime == "application/pdf":
        all_scores.append(LabelScore(label="SPAM", score=0.1, model="pdf-skip-v1"))

    result = aggregate_decision(all_scores, is_comment=_is_comment(content_type))
    result.detected_language = detected_lang if text_blob else None
    result.processing_ms = int((time.perf_counter() - start) * 1000)
    result.degraded_mode = settings.model_bundle_version.endswith("-dev")
    return result
