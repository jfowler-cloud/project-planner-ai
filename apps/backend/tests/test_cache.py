import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from planner.ai.cache import CacheClient


@pytest.fixture
async def cache_client():
    """Cache client fixture"""
    client = CacheClient()
    client.redis = MagicMock()
    yield client


@pytest.mark.asyncio
async def test_cache_key_generation():
    """Test cache key generation is consistent"""
    client = CacheClient()
    
    data1 = {"name": "test", "value": 123}
    data2 = {"value": 123, "name": "test"}  # Different order
    
    key1 = client._generate_cache_key(data1)
    key2 = client._generate_cache_key(data2)
    
    assert key1 == key2  # Should be same despite different order


@pytest.mark.asyncio
async def test_cache_plan(cache_client):
    """Test caching a plan"""
    request_data = {"project": "test"}
    plan_data = {"result": "success"}
    
    with patch.object(cache_client.redis, 'setex', new_callable=AsyncMock) as mock_setex:
        await cache_client.cache_plan(request_data, plan_data)
        mock_setex.assert_called_once()


@pytest.mark.asyncio
async def test_get_cached_plan(cache_client):
    """Test retrieving cached plan"""
    request_data = {"project": "test"}
    
    with patch.object(cache_client.redis, 'get', new_callable=AsyncMock, return_value='{"result": "cached"}'):
        result = await cache_client.get_cached_plan(request_data)
        assert result == {"result": "cached"}


@pytest.mark.asyncio
async def test_rate_limit_increment(cache_client):
    """Test rate limit increment"""
    user_id = "test_user"
    
    with patch.object(cache_client.redis, 'incr', new_callable=AsyncMock, return_value=1):
        with patch.object(cache_client.redis, 'expire', new_callable=AsyncMock):
            count = await cache_client.increment_rate_limit(user_id)
            assert count == 1


@pytest.mark.asyncio
async def test_get_rate_limit(cache_client):
    """Test getting rate limit count"""
    user_id = "test_user"
    
    with patch.object(cache_client.redis, 'get', new_callable=AsyncMock, return_value="5"):
        count = await cache_client.get_rate_limit(user_id)
        assert count == 5
