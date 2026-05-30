"""
Heuristic detector for offensive hand gestures (e.g. middle finger) in illustrations/photos.
"""

from __future__ import annotations

import numpy as np
from PIL import Image


def _skin_mask(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    return (
        (r > 85)
        & (g > 35)
        & (b > 15)
        & (r > g)
        & (r > b)
        & ((r.astype(np.int16) - g.astype(np.int16)) > 12)
    )


def offensive_gesture_score(image: Image.Image) -> float:
    """
    Returns probability [0,1] that image contains an offensive gesture.
    """
    img = image.convert("RGB").resize((128, 128), Image.Resampling.BILINEAR)
    px = np.asarray(img, dtype=np.float32)
    gray = px.mean(axis=2)
    skin = _skin_mask(px)

    light_bg_ratio = float((gray > 200).mean())
    skin_ratio = float(skin.mean())

    if skin_ratio < 0.04:
        return 0.05

    rows = np.where(skin.any(axis=1))[0]
    cols = np.where(skin.any(axis=0))[0]
    if len(rows) < 6 or len(cols) < 4:
        return 0.08

    bbox_h = int(rows[-1] - rows[0] + 1)
    bbox_w = int(cols[-1] - cols[0] + 1)
    aspect = bbox_h / max(bbox_w, 1)

    score = 0.10

    # Clipart / stock-style hand on white (middle-finger illustrations)
    if light_bg_ratio >= 0.50 and 0.08 <= skin_ratio <= 0.32:
        skin_pixels = px[skin]
        if len(skin_pixels) > 0:
            mean_rgb = skin_pixels.mean(axis=0)
            peachy = mean_rgb[0] > 180 and mean_rgb[1] > 120 and mean_rgb[2] > 90
            if peachy and aspect >= 0.85:
                score = max(score, 0.88)

    if aspect >= 1.35 and light_bg_ratio >= 0.35:
        score = max(score, 0.72)
    if aspect >= 1.8 and light_bg_ratio >= 0.45 and 0.04 <= skin_ratio <= 0.22:
        score = max(score, 0.91)
    if aspect >= 2.0 and light_bg_ratio >= 0.5:
        score = max(score, 0.94)

    # Large skin region on bright background without being full portrait nudity
    if light_bg_ratio >= 0.55 and skin_ratio >= 0.12 and skin_ratio <= 0.35 and aspect >= 0.8:
        score = max(score, 0.82)

    return min(0.98, score)
