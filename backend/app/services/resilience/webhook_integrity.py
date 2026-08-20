import logging
from redis.asyncio import Redis

logger = logging.getLogger(__name__)

class WebhookIntegrity:
    def __init__(self, redis_client=None):
        self.redis = redis_client or Redis(host='localhost', port=6379, db=0)

    async def verify_webhook(self, payload: dict, signature: str) -> bool:
        jti = payload.get("jti") or payload.get("nonce")
        if jti:
            acquired = await self.redis.set(f"webhook_jti:{jti}", "used", ex=3600, nx=True)
            if not acquired:
                logger.warning(f"Replay attack detected. JTI/nonce already used: {jti}")
                return False
        return True

    async def check_duplicate(self, webhook_id: str) -> bool:
        lock_key = f"webhook_lock:{webhook_id}"
        acquired = await self.redis.setnx(lock_key, "locked")
        if not acquired:
            logger.info(f"Duplicate webhook detected and ignored: {webhook_id}")
            return True
        await self.redis.expire(lock_key, 300)
        return False
