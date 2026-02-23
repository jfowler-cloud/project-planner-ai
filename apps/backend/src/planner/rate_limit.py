"""Token bucket rate limiter, per-IP."""

import time
import logging
from collections import defaultdict

from .constants import RATE_LIMIT_PER_MINUTE, RATE_LIMIT_PER_HOUR

logger = logging.getLogger(__name__)


class RateLimiter:
    """Sliding window rate limiter tracking per-IP request timestamps."""

    def __init__(
        self,
        per_minute: int = RATE_LIMIT_PER_MINUTE,
        per_hour: int = RATE_LIMIT_PER_HOUR,
    ):
        self._per_minute = per_minute
        self._per_hour = per_hour
        self._requests: dict[str, list[float]] = defaultdict(list)

    def _clean(self, ip: str) -> None:
        now = time.time()
        self._requests[ip] = [t for t in self._requests[ip] if now - t < 3600]

    def is_allowed(self, ip: str) -> tuple[bool, str]:
        self._clean(ip)
        now = time.time()
        timestamps = self._requests[ip]

        last_minute = sum(1 for t in timestamps if now - t < 60)
        if last_minute >= self._per_minute:
            return False, f"Rate limit exceeded: {self._per_minute} requests per minute"

        last_hour = len(timestamps)
        if last_hour >= self._per_hour:
            return False, f"Rate limit exceeded: {self._per_hour} requests per hour"

        return True, "OK"

    def record_request(self, ip: str) -> None:
        self._requests[ip].append(time.time())

    def get_stats(self, ip: str) -> dict:
        self._clean(ip)
        now = time.time()
        timestamps = self._requests[ip]
        last_minute = sum(1 for t in timestamps if now - t < 60)
        return {
            "requests_last_minute": last_minute,
            "requests_last_hour": len(timestamps),
            "minute_remaining": max(0, self._per_minute - last_minute),
            "hour_remaining": max(0, self._per_hour - len(timestamps)),
        }

    def reset(self) -> None:
        self._requests.clear()


# Singleton
rate_limiter = RateLimiter()
