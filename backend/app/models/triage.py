"""
triage.py — Data models for Step 7 Pre-Litigation Triage Engine.
"""
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class TriagePathway(str, Enum):
    SETTLEMENT_FIRST = "SETTLEMENT_FIRST"
    MEDIATION = "MEDIATION"
    LEGAL_AID = "LEGAL_AID"
    LAWYER = "LAWYER"
    LITIGATION_PREPARATION = "LITIGATION_PREPARATION"
    CLUSTER_REVIEW = "CLUSTER_REVIEW"
    PIL_REVIEW = "PIL_REVIEW"
    ADR_REVIEW = "ADR_REVIEW"
    MORE_INFORMATION_REQUIRED = "MORE_INFORMATION_REQUIRED"


class CaseReadiness(str, Enum):
    READY = "READY"
    INCOMPLETE = "INCOMPLETE"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class SettlementPotential(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TriageAssessment(BaseModel):
    recommended_pathway: TriagePathway
    confidence: float = Field(default=0.90)
    reasons: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    requires_human_review: bool = Field(default=True)
    
    # Backward Compatibility & Additional Fields
    case_readiness: CaseReadiness = Field(default=CaseReadiness.READY)
    settlement_potential: SettlementPotential = Field(default=SettlementPotential.HIGH)
    recommended_path: Optional[Any] = None
    missing_requirements: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    ai_assisted_disclaimer: str = Field(
        default="AI-Assisted Assessment Notice: Based on the information provided, this pathway may be appropriate. This evaluation does not constitute a legal guarantee or binding outcome."
    )
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
