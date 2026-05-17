"""
Redis caching for duplicate text/image moderation (pHash / text hash).
Optional — requires redis package and REDIS_URL.
"""

import hashlib
import json
import logging
from typing import Optional

from app.config import settings

log = logging.getLogger(__name__)

_client = None


def _get_client():
    global _client
    if _client is None:
        try:
            import redis

            _client = redis.from_url(settings.redis_url, decode_responses=True)
        except Exception as e:
            log.warning("Redis unavailable: %s", e)
    return _client


def cache_key_text(text: str) -> str:
    normalized = " ".join(text.lower().split())
    return "mod:text:" + hashlib.sha256(normalized.encode()).hexdigest()


def get_cached_result(key: str) -> Optional[dict]:
    client = _get_client()
    if not client:
        return None
    raw = client.get(key)
    if raw:
        return json.loads(raw)
    return None


def set_cached_result(key: str, result: dict) -> None:
    client = _get_client()
    if not client:
        return
    client.setex(key, settings.cache_ttl_seconds, json.dumps(result))
