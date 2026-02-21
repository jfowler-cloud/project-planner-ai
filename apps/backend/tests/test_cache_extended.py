import pytest
from planner.ai.cache import CacheClient


@pytest.mark.asyncio
async def test_cache_client_without_redis():
    """Test cache client operations when Redis is not connected"""
    client = CacheClient()
    # Don't connect to Redis
    
    # Should return None gracefully
    result = await client.get_cached_plan({"test": "data"})
    assert result is None
    
    # Should not raise error
    await client.cache_plan({"test": "data"}, {"result": "plan"})
    
    # Should return 0
    count = await client.increment_rate_limit("user123")
    assert count == 0
    
    count = await client.get_rate_limit("user123")
    assert count == 0


def test_generate_cache_key_consistency():
    """Test cache key generation is consistent"""
    client = CacheClient()
    
    # Same data in different order should produce same key
    data1 = {"a": 1, "b": 2, "c": 3}
    data2 = {"c": 3, "a": 1, "b": 2}
    
    key1 = client._generate_cache_key(data1)
    key2 = client._generate_cache_key(data2)
    
    assert key1 == key2
    assert key1.startswith("plan:")


def test_generate_cache_key_different_data():
    """Test different data produces different keys"""
    client = CacheClient()
    
    key1 = client._generate_cache_key({"a": 1})
    key2 = client._generate_cache_key({"a": 2})
    
    assert key1 != key2
