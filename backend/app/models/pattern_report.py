"""
pattern_report.py — Data models for Step 11 Systemic Action Engine.
"""
from typing import List, Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field
from app.models.pathway import LegalPathway


class SystemicPathway(str, Enum):
    REPRESENTATIVE_ACTION = "REPRESENTATIVE_ACTION"
    CONSOLIDATION_POSSIBILITY = "CONSOLIDATION_POSSIBILITY"
    PIL_REVIEW = "PIL_REVIEW"
    REGULATORY_REFERRAL = "REGULATORY_REFERRAL"
    LEGAL_SERVICES_AUTHORITY_REFERRAL = "LEGAL_SERVICES_AUTHORITY_REFERRAL"
    POLICY_INTERVENTION = "POLICY_INTERVENTION"


class PatternReport(BaseModel):
    report_id: str
    cluster_id: str
    cluster_size: int = Field(default=1)
    number_of_related_complaints: int = Field(default=1)
    common_issue: str
    common_facts: List[str] = Field(default_factory=list)
    common_factual_pattern: List[str] = Field(default_factory=list)
    common_evidence: List[str] = Field(default_factory=list)
    time_pattern: str = Field(default="Observed over recent 30-90 days")
    timeline_pattern: str = Field(default="Observed over recent 30-90 days")
    geographic_distribution: str = Field(default="Regional District Level")
    geographic_pattern: str = Field(default="Regional District Level")
    potential_affected_population: str = Field(default="Localized population segment")
    potential_systemic_indicators: List[str] = Field(default_factory=list)
    recommended_review_pathway: List[SystemicPathway] = Field(default_factory=list)
    possible_legal_pathways: List[LegalPathway] = Field(default_factory=list)
    pathway_recommendations: List[str] = Field(default_factory=list)
    similarity_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    potential_impact: str = Field(default="LOCALIZED")
    pil_suitability_note: str = Field(
        default="This pattern may have characteristics that warrant preliminary PIL/public-interest review."
    )
    consolidation_note: str = Field(
        default="Potential consolidation/representative-action pathway may be considered subject to applicable law and legal review."
    )
    requires_human_review: bool = True
    ai_assisted_disclaimer: str = Field(
        default="This Pattern Report provides preliminary AI-assisted cluster analysis. It requires advocate or legal services authority review before taking collective action."
    )
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ClusterDashboardData(BaseModel):
    total_active_clusters: int = 0
    high_confidence_clusters: int = 0
    pattern_reports: List[PatternReport] = Field(default_factory=list)
    last_updated: str = ""
