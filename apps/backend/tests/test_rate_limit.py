"""Tests for rate limiter."""

import pytest
from planner.rate_limit import RateLimiter


def test_allows_first_request():
    rl = RateLimiter(per_minute=5, per_hour=10)
    allowed, msg = rl.is_allowed("1.2.3.4")
    assert allowed
    assert msg == "OK"


def test_blocks_after_minute_limit():
    rl = RateLimiter(per_minute=2, per_hour=100)
    rl.record_request("ip")
    rl.record_request("ip")
    allowed, msg = rl.is_allowed("ip")
    assert not allowed
    assert "minute" in msg


def test_blocks_after_hour_limit():
    rl = RateLimiter(per_minute=100, per_hour=2)
    rl.record_request("ip")
    rl.record_request("ip")
    allowed, msg = rl.is_allowed("ip")
    assert not allowed
    assert "hour" in msg


def test_different_ips_independent():
    rl = RateLimiter(per_minute=1, per_hour=10)
    rl.record_request("ip1")
    allowed_1, _ = rl.is_allowed("ip1")
    allowed_2, _ = rl.is_allowed("ip2")
    assert not allowed_1
    assert allowed_2


def test_get_stats():
    rl = RateLimiter(per_minute=5, per_hour=10)
    rl.record_request("ip")
    stats = rl.get_stats("ip")
    assert stats["requests_last_minute"] == 1
    assert stats["requests_last_hour"] == 1
    assert stats["minute_remaining"] == 4
    assert stats["hour_remaining"] == 9


def test_reset_clears_all():
    rl = RateLimiter(per_minute=5, per_hour=10)
    rl.record_request("ip")
    rl.reset()
    stats = rl.get_stats("ip")
    assert stats["requests_last_minute"] == 0
