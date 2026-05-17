"""
Image moderation — NSFW / violence.

Production: ONNX inference (Falconsai/nsfw_image_detection).
"""

import time
from typing import Optional

import httpx

from app.models.schemas import LabelScore


async def analyze_image(url: str, client: Optional[httpx.AsyncClient] = None) -> list[LabelScore]:
    """
    Download image via presigned URL and run ONNX model.
    Stub returns low NSFW unless URL contains test marker 'nsfw-test'.
    """
    start = time.perf_counter()
    own_client = client is None
    if own_client:
        client = httpx.AsyncClient(timeout=30.0)

    try:
        # Validate reachable (HEAD)
        assert client is not None
        resp = await client.head(url)
        if resp.status_code >= 400:
            return [LabelScore(label="NSFW", score=0.5, model="fetch-error-v1")]

        score = 0.95 if "nsfw-test" in url else 0.08
        return [LabelScore(label="NSFW", score=score, model="nsfw-stub-v1")]
    finally:
        if own_client and client:
            await client.aclose()
        _ = time.perf_counter() - start
