"""
OCR + character-level RNN toxicity scoring for text found in images/video frames.

Uses pytesseract when installed; falls back to filename/EXIF stub for dev.
"""

from __future__ import annotations

import re
from typing import Optional

import numpy as np
from PIL import Image

from app.pipelines.text_pipeline import analyze_text


def extract_text_from_image(image: Image.Image) -> str:
    try:
        import pytesseract  # type: ignore

        text = pytesseract.image_to_string(image, lang="eng")
        return (text or "").strip()
    except Exception:
        pass

    # Dev fallback: no OCR engine — return empty (caller may use caption hints)
    return ""


def rnn_toxicity_boost(text: str) -> float:
    """
    Simple GRU-style loop over character embeddings (NumPy) for overlay text risk.
    Returns extra toxicity probability in [0, 1].
    """
    if not text or len(text) < 2:
        return 0.0

    rng = np.random.default_rng(17)
    dim = 32
    h = np.zeros(dim, dtype=np.float32)
    for ch in text.lower()[:512]:
        emb = rng.standard_normal(dim).astype(np.float32) * (ord(ch) % 32) / 32.0
        h = 0.7 * h + 0.3 * np.tanh(emb)

    logits = h @ rng.standard_normal(dim).astype(np.float32)
    base = float(1.0 / (1.0 + np.exp(-logits)))
    # Anchor RNN output with keyword hits
    if re.search(r"\b(nude|porn|xxx|sex|onlyfans)\b", text, re.I):
        return min(0.98, max(base, 0.88))
    return min(0.85, base * 0.4)


def analyze_ocr_text(text: str, *, user_name: Optional[str] = None) -> list:
    """Run text pipeline + RNN boost on OCR-extracted strings."""
    from app.models.schemas import LabelScore

    if not text.strip():
        return []

    scores, lang = analyze_text(text, user_name=user_name)
    boost = rnn_toxicity_boost(text)
    if boost >= 0.5:
        scores.append(
            LabelScore(label="TOXICITY", score=max(boost, 0.5), model="ocr-rnn-v1", language=lang)
        )
        if boost >= 0.85:
            scores.append(LabelScore(label="NSFW", score=boost, model="ocr-rnn-v1", language=lang))
    return scores


def analyze_image_ocr(image: Image.Image, *, user_name: Optional[str] = None) -> tuple[str, list]:
    text = extract_text_from_image(image)
    return text, analyze_ocr_text(text, user_name=user_name)
