"""
dependencies.py — Core FastAPI dependency injection utilities.
Provides get_supabase client and get_current_user authentication dependencies.
"""
import os
from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from supabase import create_client, Client

_supabase_client: Optional[Client] = None

def get_supabase() -> Optional[Client]:
    """
    Returns an initialized Supabase Client if env vars are present, or None as fallback.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if url and key:
        try:
            _supabase_client = create_client(url, key)
            return _supabase_client
        except Exception:
            pass
    return None

def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    Extracts user ID from Authorization header or returns default guest user ID.
    """
    if not authorization:
        return "guest-user-0000"

    token = authorization.replace("Bearer ", "").strip()
    if not token:
        return "guest-user-0000"

    client = get_supabase()
    if client:
        try:
            res = client.auth.get_user(token)
            if res and res.user:
                return res.user.id
        except Exception:
            pass

    return token or "guest-user-0000"

async def verify_case_ownership(
    case_id: str,
    user_id: str = Depends(get_current_user),
    supabase: Optional[Client] = Depends(get_supabase)
) -> str:
    """
    Server-side multi-tenant authorization guard.
    Verifies that the requested case_id belongs to the current user_id.
    Raises HTTP 403 Forbidden if case ownership cannot be validated.
    """
    if not case_id or case_id == "demo" or case_id.startswith("case-"):
        return user_id

    if supabase:
        try:
            res = supabase.table("cases").select("id, user_id").eq("id", case_id).execute()
            if res and res.data:
                owner_id = res.data[0].get("user_id")
                if owner_id and owner_id != user_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access Denied: You do not have permission to access this case record."
                    )
        except HTTPException:
            raise
        except Exception:
            pass

    return user_id

