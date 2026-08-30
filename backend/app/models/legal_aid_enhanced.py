"""
legal_aid_enhanced.py — Data models for Step 13 Legal Aid + DLSA Engine.
"""
from typing import List, Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field


class LegalAidStatus(str, Enum):
    ELIGIBLE = "Eligible"
    POTENTIALLY_ELIGIBLE = "Potentially Eligible"
    NOT_ELIGIBLE = "Not Eligible Based on Available Information"
    INSUFFICIENT_INFO = "Insufficient Information"


class LegalAidAssessment(BaseModel):
    status: LegalAidStatus = Field(
        ...,
        description="Must be 'Eligible', 'Potentially Eligible', 'Not Eligible Based on Available Information', or 'Insufficient Information'"
    )
    matched_criteria: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    explanation: str
    what_to_do_next: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
    documents_to_prepare: List[str] = Field(default_factory=list)
    document_checklist: List[str] = Field(default_factory=list)
    legal_services_authority_pathway: str = Field(
        default="District Legal Services Authority (DLSA) / Taluk Legal Services Committee (TLSC)"
    )
    location_specific_guidance: Dict[str, Any] = Field(default_factory=dict)
    appropriate_authority: Optional[Dict[str, Any]] = None
    application_guidance: List[str] = Field(default_factory=list)
    is_deterministic: bool = Field(default=True)
    ai_disclaimer: str = Field(
        default="This evaluation is produced deterministically under Section 12 of the Legal Services Authorities Act, 1987. Final legal aid assignment is determined by DLSA upon document verification."
    )
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
