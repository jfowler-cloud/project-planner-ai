import redis.asyncio as redis
import json
import hashlib
from typing import Optional, Any
from ..config import settings


class CacheClient:
    """Redis cache client for AI responses"""
    
    def __init__(self):
        self.redis: Optional[redis.Redis] = None
    
    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis = await redis.from_url(settings.redis_url, decode_responses=True)
            # Test connection
            await self.redis.ping()
        except Exception as e:
            print(f"⚠️  Redis connection failed: {e}. Caching disabled.")
            self.redis = None
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis:
            await self.redis.close()
    
    def _generate_cache_key(self, request_data: dict) -> str:
        """Generate cache key from request data"""
        # Sort keys for consistent hashing
        sorted_data = json.dumps(request_data, sort_keys=True)
        return f"plan:{hashlib.sha256(sorted_data.encode()).hexdigest()}"
    
    async def get_cached_plan(self, request_data: dict) -> Optional[dict]:
        """Get cached plan if exists"""
        if not self.redis:
            return None
        
        cache_key = self._generate_cache_key(request_data)
        cached = await self.redis.get(cache_key)
        
        if cached:
            return json.loads(cached)
        return None
    
    async def cache_plan(self, request_data: dict, plan_data: dict):
        """Cache plan with TTL"""
        if not self.redis:
            return
        
        cache_key = self._generate_cache_key(request_data)
        await self.redis.setex(
            cache_key,
            settings.cache_ttl,
            json.dumps(plan_data)
        )
    
    async def increment_rate_limit(self, user_id: str) -> int:
        """Increment rate limit counter"""
        if not self.redis:
            return 0
        
        key = f"rate_limit:{user_id}"
        count = await self.redis.incr(key)
        
        if count == 1:
            await self.redis.expire(key, 3600)  # 1 hour
        
        return count
    
    async def get_rate_limit(self, user_id: str) -> int:
        """Get current rate limit count"""
        if not self.redis:
            return 0
        
        key = f"rate_limit:{user_id}"
        count = await self.redis.get(key)
        return int(count) if count else 0


cache_client = CacheClient()
