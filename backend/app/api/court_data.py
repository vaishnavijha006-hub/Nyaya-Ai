"""
court_data.py — FastAPI Router for NJDG / eCourts Case Lookup & Health.

Endpoints:
  - POST /api/court-data/case-lookup : Lookup court case details by CNR or Case Number.
  - GET /api/court-data/health       : Provider health status and live/fallback state.
"""
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services.court_data_provider import (
    get_court_data_provider,
    validate_court_identifier,
)
from app.services.delay_tracking_engine import evaluate_case_delay_intelligence
from app.utils.security import sanitize_input, check_prompt_injection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/court-data", tags=["Court Data"])
limiter = Limiter(key_func=get_remote_address)


class CourtLookupRequest(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=50, description="CNR Number (16 chars) or Court Case Number")
    identifier_type: str = Field(default="AUTO", description="Identifier type: CNR, CASE_NUMBER, or AUTO")
    case_id: Optional[str] = Field(default=None, description="Optional internal Nyaya AI Case ID to link")


class CourtLookupResponse(BaseModel):
    success: bool
    identifier: str
    identifier_type: str
    source: str
    source_mode: str
    court_data: Dict[str, Any]
    delay_report: Dict[str, Any]
    disclaimer: str


@router.post("/case-lookup", response_model=CourtLookupResponse)
@limiter.limit("20/minute")
async def case_lookup(request: Request, body: CourtLookupRequest):
    """
    Looks up official court records or user-reported data via CNR or Case Number.
    Integrates results directly with the Nyaya AI Delay Intelligence Engine.
    """
    clean_identifier = sanitize_input(body.identifier)
    check_prompt_injection(clean_identifier)

    val_res = validate_court_identifier(clean_identifier)
    if not val_res.get("valid"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=val_res.get("error", "Invalid court identifier format.")
        )

    provider = get_court_data_provider()

    try:
        court_data = provider.lookup_case(
            identifier=val_res.get("identifier", clean_identifier),
            identifier_type=val_res.get("type", body.identifier_type)
        )
    except Exception as exc:
        logger.error(f"Court lookup error for {clean_identifier}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Court data provider lookup failed: {str(exc)}"
        )

    # Feed into Delay Intelligence Engine
    hearing_history = court_data.get("hearing_history", [])
    delay_report_model = evaluate_case_delay_intelligence(
        case_info=court_data,
        hearing_history=hearing_history
    )

    delay_report_dict = delay_report_model.model_dump() if hasattr(delay_report_model, 'model_dump') else delay_report_model.dict()

    return CourtLookupResponse(
        success=True,
        identifier=court_data.get("identifier", clean_identifier),
        identifier_type=court_data.get("identifier_type", val_res.get("type", "CNR")),
        source=court_data.get("source", "User-reported data"),
        source_mode=court_data.get("source_mode", "FALLBACK"),
        court_data=court_data,
        delay_report=delay_report_dict,
        disclaimer=(
            "This system displays data retrieved from official court records or user-reported inputs. "
            "Nyaya AI does not judge whether adjournments or delays were legally justified."
        )
    )


@router.get("/health")
async def court_data_health():
    """
    Returns court data provider status and whether live eCourts API integration is active.
    """
    provider = get_court_data_provider()
    status_info = provider.get_provider_status()
    return {
        "status": "healthy",
        "provider": status_info
    }
