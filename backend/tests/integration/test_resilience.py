import pytest
import asyncio
from app.services.resilience.webhook_integrity import WebhookIntegrity

class FakeAsyncRedis:
    def __init__(self):
        self._data = {}
        self._lock = asyncio.Lock()
        
    async def set(self, key, value, ex=None, nx=False):
        async with self._lock:
            if nx and key in self._data:
                return None
            self._data[key] = value
            return True
            
    async def setnx(self, key, value):
        res = await self.set(key, value, nx=True)
        return bool(res)
        
    async def expire(self, key, seconds):
        return True

@pytest.mark.asyncio
async def test_webhook_integrity_concurrency():
    fake_redis = FakeAsyncRedis()
    integrity = WebhookIntegrity(redis_client=fake_redis)
    
    # Simulate 100 concurrent requests with the SAME JTI
    payload = {"jti": "unique_nonce_42"}
    signature = "dummy_sig"
    
    # Gather 100 concurrent verify_webhook calls
    results = await asyncio.gather(*(
        integrity.verify_webhook(payload, signature) for _ in range(100)
    ))
    
    # EXACTLY one should return True, the rest False (replay attack prevented)
    assert results.count(True) == 1
    assert results.count(False) == 99

@pytest.mark.asyncio
async def test_webhook_check_duplicate_concurrency():
    fake_redis = FakeAsyncRedis()
    integrity = WebhookIntegrity(redis_client=fake_redis)
    webhook_id = "wbhk_123"
    
    results = await asyncio.gather(*(
        integrity.check_duplicate(webhook_id) for _ in range(100)
    ))
    
    # check_duplicate returns True if duplicate (i.e. NOT acquired)
    # So 1 request acquires lock (returns False), 99 requests are duplicate (return True)
    assert results.count(False) == 1
    assert results.count(True) == 99
