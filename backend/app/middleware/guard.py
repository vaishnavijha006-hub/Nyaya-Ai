import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.services.guard.guard_service import guard_service

class GuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Rate Limiting Check
        # Dummy user_id and endpoint for illustration
        user_id = request.headers.get("X-User-Id", "anonymous")
        endpoint = request.url.path
        
        # Simple policy for everything
        if guard_service.rate_limit_engine.is_rate_limited(endpoint, user_id, limit=100, window=60):
            # Should ideally return a 429 response here
            pass
        
        start_time = time.time()
        
        try:
            response = await call_next(request)
        except Exception as e:
            # 2. Fail-safe interception
            await guard_service.incident_engine.report_incident(
                title="Unhandled Exception",
                description=str(e),
                severity="high"
            )
            raise e
            
        process_time = time.time() - start_time
        
        # 3. Anomaly Detection (Post-process)
        # In a real app we'd enqueue this or check asynchronously
        
        return response
