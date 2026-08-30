"""
pil_analysis.py — Data models for Step 12 PIL Suitability Analysis.
"""
from typing import List, Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field
from app.models.pathway import LegalPathway


class PILSuitabilityOutcome(str, Enum):
    LOW_INDICATION = "LOW INDICATION"
    MODERATE_INDICATION = "MODERATE INDICATION"
    HIGHER_INDICATION = "HIGHER INDICATION"
    INSUFFICIENT_INFORMATION = "INSUFFICIENT INFORMATION"


class PILSuitabilityResult(BaseModel):
    potential_suitability: PILSuitabilityOutcome = Field(default=PILSuitabilityOutcome.LOW_INDICATION)
    reasons: List[str] = Field(default_factory=list)
    counter_indicators: List[str] = Field(default_factory=list)
    supporting_pattern_data: List[str] = Field(default_factory=list)
    requires_legal_review: bool = Field(default=True)
    
    # Backward Compatibility
    potential_pil: bool = Field(default=False)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    public_interest_factors: List[str] = Field(default_factory=list)
    why_flagged: List[str] = Field(default_factory=list)
    alternative_paths: List[LegalPathway] = Field(default_factory=list)
    assessment_framing: str = Field(
        default="This matter shows characteristics that may warrant preliminary PIL review."
    )
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class PILReviewBrief(BaseModel):
    brief_title: str = Field(default="PIL Review Brief (Preliminary Analysis)")
    problem: str
    issue: str = Field(default="")
    affected_population: str = Field(default="Wider public / Affected community")
    pattern_evidence: List[str] = Field(default_factory=list)
    systemic_pattern: List[str] = Field(default_factory=list)
    public_interest_indicators: List[str] = Field(default_factory=list)
    existing_remedies: List[str] = Field(default_factory=list)
    questions_requiring_lawyer_review: List[str] = Field(default_factory=list)
    unanswered_questions: List[str] = Field(default_factory=list)
    supporting_evidence: List[str] = Field(default_factory=list)
    relevant_legal_provisions: List[Dict[str, Any]] = Field(default_factory=list)
    potential_public_interest_concern: str = Field(default="")
    recommended_human_review: str = Field(
        default="Consult a constitutional or public-interest legal advocate for professional PIL maintainability evaluation under Article 226 / Article 32."
    )
    ai_disclaimer: str = Field(
        default="This brief is an AI-assisted analytical synthesis of user-provided information for advocate review. Nyaya AI does NOT file PILs or declare legal maintainability."
    )
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
