import logging
import time

logger = logging.getLogger(__name__)

class RateLimitEngine:
    def __init__(self):
        self.policies = {}
        self.requests = {}

    def is_rate_limited(self, endpoint: str, user_id: str, limit: int, window: int) -> bool:
        """
        Check if the request should be rate limited.
        """
        key = f"{endpoint}:{user_id}"
        current_time = time.time()
        
        if key not in self.requests:
            self.requests[key] = []
            
        # Clean old requests
        self.requests[key] = [t for t in self.requests[key] if current_time - t < window]
        
        if len(self.requests[key]) >= limit:
            logger.warning(f"Rate limit exceeded for {key}")
            return True
            
        self.requests[key].append(current_time)
        return False
