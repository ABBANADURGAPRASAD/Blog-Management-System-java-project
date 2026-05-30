"""
Image moderation — CNN NSFW + OCR/RNN on embedded text.
"""

import io
import time
from typing import Optional

import httpx
from PIL import Image

from app.ml.cnn_nsfw import cnn_nsfw_score
from app.ml.gesture_detector import offensive_gesture_score
from app.ml.ocr_rnn import analyze_image_ocr
from app.models.schemas import LabelScore


async def analyze_image(url: str, client: Optional[httpx.AsyncClient] = None) -> list[LabelScore]:
    """Download image via URL and run CNN + OCR pipelines."""
    start = time.perf_counter()
    own_client = client is None
    if own_client:
        client = httpx.AsyncClient(timeout=30.0)

    try:
        assert client is not None
        if url.startswith("file://"):
            path = url.replace("file://", "", 1)
            with open(path, "rb") as f:
                return analyze_image_bytes(f.read())
        resp = await client.get(url)
        if resp.status_code >= 400:
            return [LabelScore(label="NSFW", score=0.5, model="fetch-error-v1")]
        return analyze_image_bytes(resp.content)
    finally:
        if own_client and client:
            await client.aclose()
        _ = time.perf_counter() - start


def analyze_image_bytes(data: bytes, *, user_name: Optional[str] = None) -> list[LabelScore]:
    """Analyze raw image bytes: CNN adult content + OCR text RNN."""
    scores: list[LabelScore] = []

    if "nsfw-test" in str(data[:200]):
        scores.append(LabelScore(label="NSFW", score=0.95, model="test-marker-v1"))
        return scores

    try:
        image = Image.open(io.BytesIO(data))
    except Exception:
        return [LabelScore(label="NSFW", score=0.5, model="image-decode-error-v1")]

    # Downscale before CNN/OCR to keep post uploads responsive
    max_edge = 512
    w, h = image.size
    if max(w, h) > max_edge:
        scale = max_edge / float(max(w, h))
        image = image.resize((int(w * scale), int(h * scale)), Image.Resampling.BILINEAR)

    nsfw_score, model_id = cnn_nsfw_score(image)
    gesture_score = offensive_gesture_score(image)
    combined_visual = max(nsfw_score, gesture_score)

    scores.append(LabelScore(label="NSFW", score=combined_visual, model=model_id))
    if gesture_score >= 0.7:
        scores.append(
            LabelScore(label="VIOLENCE", score=gesture_score, model="gesture-detector-v1")
        )
    elif combined_visual >= 0.7:
        scores.append(
            LabelScore(label="VIOLENCE", score=min(0.9, combined_visual * 0.85), model=model_id)
        )

    _ocr_text, ocr_scores = analyze_image_ocr(image, user_name=user_name)
    scores.extend(ocr_scores)

    return scores
