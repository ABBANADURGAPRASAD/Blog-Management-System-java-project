"""
Text moderation pipeline — multilingual.

Production: wire fastText LID, transformers models (see docs/MODELS-AND-THRESHOLDS.md).
This module ships heuristic + keyword stubs so the service runs without GPU/model downloads.
"""

import hashlib
import re
import time
from typing import Optional

from app.models.schemas import LabelScore

# Romanized / common patterns for demo; replace with ML inference
_ABUSE_PATTERNS = [
    re.compile(r"\b(kill\s+yourself|kys)\b", re.I),
    re.compile(r"\b(nude|porn|xxx)\b", re.I),
]
_SPAM_PATTERNS = [re.compile(r"(bit\.ly|free\s+crypto|click\s+here\s+to\s+win)", re.I)]


def detect_language(text: str, hint: Optional[str] = None) -> str:
    if hint:
        return hint[:2].lower()
    # Stub: unicode range heuristics
    if re.search(r"[\u0900-\u097F]", text):
        return "hi"
    if re.search(r"[\u0C00-\u0C7F]", text):
        return "te"
    if re.search(r"[\u0600-\u06FF]", text):
        return "ar"
    return "en"


def _heuristic_scores(text: str, lang: str) -> list[LabelScore]:
    scores: list[LabelScore] = []
    for pat in _ABUSE_PATTERNS:
        if pat.search(text):
            scores.append(
                LabelScore(label="TOXICITY", score=0.92, model="heuristic-v1", language=lang)
            )
            break
    for pat in _SPAM_PATTERNS:
        if pat.search(text):
            scores.append(LabelScore(label="SPAM", score=0.88, model="heuristic-v1", language=lang))
            break
    if not scores:
        scores.append(LabelScore(label="TOXICITY", score=0.05, model="heuristic-v1", language=lang))
    return scores


def analyze_text(
    text: str,
    *,
    language_hint: Optional[str] = None,
    user_name: Optional[str] = None,
) -> tuple[list[LabelScore], str]:
    start = time.perf_counter()
    combined = " ".join(filter(None, [user_name or "", text or ""])).strip()
    if not combined:
        return [], "en"

    lang = detect_language(combined, language_hint)
    # TODO: Redis cache key = sha256(normalized text)
    _ = hashlib.sha256(combined.encode()).hexdigest()

    # TODO: if lang in indic -> dehatebert; elif en -> toxic-bert ensemble
    scores = _heuristic_scores(combined, lang)

    if user_name and re.search(r"(admin|official|support)", user_name, re.I):
        scores.append(
            LabelScore(label="IMPERSONATION", score=0.65, model="heuristic-v1", language=lang)
        )

    _ = time.perf_counter() - start
    return scores, lang
