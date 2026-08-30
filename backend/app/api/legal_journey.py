from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.services.legal_journey_engine import process_legal_journey, get_required_documents
from app.services.dlsa_directory import get_nearest_dlsa

router = APIRouter(prefix="/api/legal-journey", tags=["legal-journey"])


class LegalJourneyRequest(BaseModel):
    user_input: str
    user_profile: Optional[Dict[str, Any]] = None
    uploaded_doc_names: Optional[List[str]] = None


@router.post("/analyze")
async def analyze_journey_endpoint(request: LegalJourneyRequest):
    """
    Executes the 5-stage complete legal journey:
    1. Problem Intake & Case Category Extraction
    2. Required vs Missing Documents Analysis
    3. RAG Statutory Rights & Landmark Judgments Retrieval
    4. DLSA Government Free Legal Aid Eligibility Evaluation (Section 12)
    5. Nearest DLSA Office Locator & Application Guide
    """
    try:
        if not request.user_input.strip():
            raise HTTPException(status_code=400, detail="User problem input cannot be empty.")

        result = process_legal_journey(
            user_input=request.user_input,
            user_profile=request.user_profile,
            uploaded_doc_names=request.uploaded_doc_names
        )
        return {"success": True, "journey": result}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Legal journey evaluation failed: {str(exc)}")


@router.get("/nearest-dlsa")
async def nearest_dlsa_endpoint(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None)
):
    """Lookup nearest District Legal Services Authority (DLSA) office by state and district."""
    try:
        return get_nearest_dlsa(state=state, district=district)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"DLSA lookup failed: {str(exc)}")


@router.get("/required-documents")
async def required_documents_endpoint(category: Optional[str] = Query(None)):
    """Get required document matrix for a specific legal category."""
    return {"category": category or "DEFAULT", "required_documents": get_required_documents(category)}
