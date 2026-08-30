"""
cluster.py — Data models for Step 10 Case Clustering Engine.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ClusterCaseMatch(BaseModel):
    case_id: str
    similarity_score: float
    category: str
    anonymized_summary: str
    location: str


class ClusterDetectionResult(BaseModel):
    cluster_detected: bool = False
    cluster_id: Optional[str] = None
    number_of_cases: int = Field(default=1)
    cluster_size: int = Field(default=1)
    common_issue: str = Field(default="")
    common_issues: List[str] = Field(default_factory=list)
    common_entities: List[str] = Field(default_factory=list)
    geographic_pattern: str = Field(default="Safe Aggregation Level (District/City)")
    common_facts: List[str] = Field(default_factory=list)
    common_documents: List[str] = Field(default_factory=list)
    time_trend: str = Field(default="Recent (Past 30-90 days)")
    similarity_score: float = Field(default=0.0, ge=0.0, le=1.0)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    requires_human_review: bool = Field(default=True)
    message: str = Field(
        default="These cases show semantic similarities and may warrant human/legal review for a common underlying issue."
    )
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
