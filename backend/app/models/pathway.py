"""
pathway.py — Data models for the Legal Pathway Router.
"""
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class LegalPathway(str, Enum):
    SETTLEMENT = "SETTLEMENT"
    MEDIATION = "MEDIATION"
    LEGAL_AID = "LEGAL_AID"
    INDIVIDUAL_LITIGATION = "INDIVIDUAL_LITIGATION"
    CLUSTER_REVIEW = "CLUSTER_REVIEW"
    PIL_REVIEW = "PIL_REVIEW"
    LOK_ADALAT_REVIEW = "LOK_ADALAT_REVIEW"
    REGULATORY_REFERRAL = "REGULATORY_REFERRAL"
    DOCUMENT_COMPLETION = "DOCUMENT_COMPLETION"


class PathwayRecommendation(BaseModel):
    recommended_path: LegalPathway
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    reasons: List[str] = Field(default_factory=list)
    alternative_paths: List[LegalPathway] = Field(default_factory=list)
    requires_human_review: bool = True
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
