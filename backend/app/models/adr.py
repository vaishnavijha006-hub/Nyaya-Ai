"""
adr.py — Data models for Step 14 ADR Routing Engine.
"""
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ADRPathway(str, Enum):
    MEDIATION = "Mediation"
    LOK_ADALAT = "Lok Adalat"
    PERMANENT_LOK_ADALAT = "Permanent Lok Adalat"
    ARBITRATION = "Arbitration"
    LITIGATION = "Litigation Review"


class ADROutcome(str, Enum):
    MEDIATION_REVIEW = "MEDIATION_REVIEW"
    LOK_ADALAT_REVIEW = "LOK_ADALAT_REVIEW"
    PERMANENT_LOK_ADALAT_REVIEW = "PERMANENT_LOK_ADALAT_REVIEW"
    OTHER_ADR_REVIEW = "OTHER_ADR_REVIEW"
    LITIGATION_REVIEW = "LITIGATION_REVIEW"
    HUMAN_REVIEW = "HUMAN_REVIEW"


class ADRRecommendation(BaseModel):
    pathway: ADRPathway = Field(..., description="Recommended ADR pathway")
    reasons: List[str] = Field(default_factory=list)
    conditions: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    requires_human_review: bool = Field(default=True)
    
    # Generated ADR Details
    adr_explanation: str = Field(default="")
    required_information: List[str] = Field(default_factory=list)
    document_checklist: List[str] = Field(default_factory=list)
    process_overview: List[str] = Field(default_factory=list)
    next_step_guidance: str = Field(default="")
    
    # Legacy Compatibility
    adr_outcome: ADROutcome = Field(default=ADROutcome.MEDIATION_REVIEW)
    suitability_explanation: str = Field(default="")
    is_eligible_for_adr: bool = Field(default=True)
    factors_considered: Dict[str, Any] = Field(default_factory=dict)
    adr_summary: str = Field(default="")
    issues_in_dispute: List[str] = Field(default_factory=list)
    parties_positions: Dict[str, str] = Field(default_factory=dict)
    documents: List[str] = Field(default_factory=list)
    unresolved_questions: List[str] = Field(default_factory=list)
    suggested_next_step: str = Field(default="")
    disclaimer: str = Field(
        default="ADR recommendation is preliminary and non-binding. Final maintainability requires advocate or statutory authority review."
    )
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ADRAnalysisResult(ADRRecommendation):
    """Alias for backward compatibility."""
    pass
