"""
Orchestrates text, image, and video pipelines for a single moderation request.
"""

import time
from typing import Optional

import httpx

from app.config import settings
from app.core.decision_engine import aggregate_decision
from app.models.schemas import ContentType, ModerationPayload, ModerationResult
from app.pipelines.image_pipeline import analyze_image
from app.pipelines.text_pipeline import analyze_text
from app.pipelines.video_pipeline import analyze_video_from_url


def _is_comment(content_type: ContentType) -> bool:
    return content_type == ContentType.COMMENT


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
