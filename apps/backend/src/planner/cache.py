"""LRU response cache with TTL expiration."""

import hashlib
import json
import logging
import time
from collections import OrderedDict

from .constants import CACHE_MAX_SIZE, CACHE_TTL_SECONDS

logger = logging.getLogger(__name__)


class ResponseCache:
    """Thread-safe LRU cache with TTL for AI responses."""

    def __init__(self, max_size: int = CACHE_MAX_SIZE, ttl: int = CACHE_TTL_SECONDS):
        self._cache: OrderedDict[str, tuple[object, float]] = OrderedDict()
        self._max_size = max_size
        self._ttl = ttl

    def _is_expired(self, timestamp: float) -> bool:
        return time.time() - timestamp > self._ttl

    def get(self, key: str) -> object | None:
        if key not in self._cache:
            return None
        value, timestamp = self._cache[key]
        if self._is_expired(timestamp):
            del self._cache[key]
            return None
        # Move to end (most recently used)
        self._cache.move_to_end(key)
        return value

    def set(self, key: str, value: object) -> None:
        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = (value, time.time())
        if len(self._cache) > self._max_size:
            evicted = next(iter(self._cache))
            del self._cache[evicted]

    def clear(self) -> None:
        self._cache.clear()

    def cleanup_expired(self) -> int:
        expired = [k for k, (_, ts) in self._cache.items() if self._is_expired(ts)]
        for k in expired:
            del self._cache[k]
        return len(expired)

    def get_stats(self) -> dict:
        now = time.time()
        active = sum(1 for _, ts in self._cache.values() if not self._is_expired(ts))
        return {
            "total_entries": len(self._cache),
            "active_entries": active,
            "max_size": self._max_size,
            "ttl_seconds": self._ttl,
        }


def make_cache_key(inputs: dict) -> str:
    """Generate a stable cache key from questionnaire inputs."""
    # Exclude cache-control fields
    filtered = {k: v for k, v in inputs.items() if k != "force_refresh"}
    serialized = json.dumps(filtered, sort_keys=True)
    return hashlib.sha256(serialized.encode()).hexdigest()


# Singleton
response_cache = ResponseCache()
