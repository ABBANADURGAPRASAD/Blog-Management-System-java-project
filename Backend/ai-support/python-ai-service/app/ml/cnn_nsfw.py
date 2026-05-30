"""
Lightweight CNN-style NSFW classifier (224x224 RGB).

Production: swap weights with ONNX export (e.g. Falconsai/nsfw_image_detection).
"""

from __future__ import annotations

import io
import os
from functools import lru_cache

import numpy as np
from PIL import Image

from app.ml.gesture_detector import offensive_gesture_score

INPUT_SIZE = 224
_NSFW_ONNX_ENV = "NSFW_ONNX_MODEL_PATH"


def _preprocess(img: Image.Image) -> np.ndarray:
    img = img.convert("RGB").resize((INPUT_SIZE, INPUT_SIZE), Image.Resampling.BILINEAR)
    arr = np.asarray(img, dtype=np.float32) / 255.0
    return np.transpose(arr, (2, 0, 1))[np.newaxis, ...]


def _relu(x: np.ndarray) -> np.ndarray:
    return np.maximum(x, 0.0)


def _max_pool(x: np.ndarray, k: int = 2) -> np.ndarray:
    n, c, h, w = x.shape
    h2, w2 = h // k, w // k
    x = x[:, :, : h2 * k, : w2 * k]
    x = x.reshape(n, c, h2, k, w2, k)
    return x.max(axis=(3, 5))


@lru_cache(maxsize=1)
def _cnn_weights() -> dict[str, np.ndarray]:
    rng = np.random.default_rng(42)
    return {
        "c1": rng.standard_normal((16, 3, 3, 3)).astype(np.float32) * 0.05,
        "c2": rng.standard_normal((32, 16, 3, 3)).astype(np.float32) * 0.05,
        "c3": rng.standard_normal((64, 32, 3, 3)).astype(np.float32) * 0.05,
        "fc": rng.standard_normal((64, 1)).astype(np.float32) * 0.1,
        "bias": np.array([0.0], dtype=np.float32),
    }


def _conv2d(x: np.ndarray, w: np.ndarray) -> np.ndarray:
    n, c_in, h, w_in = x.shape
    c_out, _, kh, kw = w.shape
    out_h, out_w = h - kh + 1, w_in - kw + 1
    out = np.zeros((n, c_out, out_h, out_w), dtype=np.float32)
    for co in range(c_out):
        for ci in range(c_in):
            patch = w[co, ci]
            for i in range(out_h):
                for j in range(out_w):
                    out[:, co, i, j] += (x[:, ci, i : i + kh, j : j + kw] * patch).sum(axis=(1, 2))
    return out


def cnn_nsfw_score(image: Image.Image) -> tuple[float, str]:
    onnx_path = os.environ.get(_NSFW_ONNX_ENV, "").strip()
    if onnx_path and os.path.isfile(onnx_path):
        try:
            return _score_onnx(image, onnx_path)
        except Exception:
            pass

    x = _preprocess(image)
    w = _cnn_weights()
    h = _relu(_conv2d(x, w["c1"]))
    h = _max_pool(h)
    h = _relu(_conv2d(h, w["c2"]))
    h = _max_pool(h)
    h = _relu(_conv2d(h, w["c3"]))
    h = _max_pool(h)
    # Global average pool → (batch, channels)
    gap = h.mean(axis=(2, 3))
    logit = gap @ w["fc"] + w["bias"]
    cnn_prob = float(1.0 / (1.0 + np.exp(-logit[0, 0])))

    gesture = offensive_gesture_score(image)
    skin_h = _skin_exposure_heuristic(image)
    combined = min(0.99, max(cnn_prob, gesture, skin_h))
    model = "cnn-nsfw-v1+gesture" if gesture >= 0.7 else "cnn-nsfw-v1"
    return combined, model


def _skin_exposure_heuristic(img: Image.Image) -> float:
    small = img.convert("RGB").resize((64, 64), Image.Resampling.BILINEAR)
    px = np.asarray(small, dtype=np.float32)
    r, g, b = px[:, :, 0], px[:, :, 1], px[:, :, 2]
    skin = (r > 95) & (g > 40) & (b > 20) & (r > g) & (r > b) & ((r - g) > 15)
    ratio = float(skin.mean())
    if ratio > 0.55:
        return min(0.75, 0.35 + ratio * 0.5)
    return 0.05


def _score_onnx(image: Image.Image, path: str) -> tuple[float, str]:
    import onnxruntime as ort  # type: ignore

    sess = ort.InferenceSession(path, providers=["CPUExecutionProvider"])
    inp_name = sess.get_inputs()[0].name
    tensor = _preprocess(image)
    out = sess.run(None, {inp_name: tensor})[0]
    if out.ndim == 2 and out.shape[1] >= 2:
        exp = np.exp(out - out.max(axis=1, keepdims=True))
        prob = (exp / exp.sum(axis=1, keepdims=True))[0, 1]
        base = float(prob)
    else:
        base = min(1.0, max(0.0, float(out.reshape(-1)[0])))
    gesture = offensive_gesture_score(image)
    return min(0.99, max(base, gesture)), "onnx-nsfw-v1+gesture"


def classify_image_bytes(data: bytes) -> tuple[float, str]:
    img = Image.open(io.BytesIO(data))
    return cnn_nsfw_score(img)
