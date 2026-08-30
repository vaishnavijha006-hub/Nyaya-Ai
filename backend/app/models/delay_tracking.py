"""
delay_tracking.py — Data models for Step 15 Case Delay Intelligence.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AdjournmentRecord(BaseModel):
    adjournment_id: str
    hearing_date: str
    next_hearing_date: Optional[str] = None
    reason: str
    requested_by: str = Field(default="Joint / Unspecified")
    delay_days: int = 0


class HearingRecord(BaseModel):
    hearing_id: str
    hearing_date: str
    stage: str = Field(default="Pleading / Intake Stage")
    outcome: str = Field(default="Completed")
    adjournment_details: Optional[AdjournmentRecord] = None


class DelayTrackingReport(BaseModel):
    report_id: str
    filing_date: Optional[str] = None
    total_case_age: str = Field(default="0 days")
    total_case_age_days: int = Field(default=0)
    total_elapsed_days: int = Field(default=0)
    number_of_hearings: int = Field(default=0)
    total_hearings: int = Field(default=0)
    number_of_adjournments: int = Field(default=0)
    recorded_delay: str = Field(default="0 days")
    cumulative_adjournment_delay_days: int = Field(default=0)
    estimated_impact: str = Field(
        default="Estimated impact: Historical data is insufficient to estimate expected delay."
    )
    estimated_delay_impact_note: str = Field(
        default="Historical data is insufficient to estimate expected delay."
    )
    reason_distribution: Dict[str, int] = Field(default_factory=dict)
    adjournment_reasons: List[str] = Field(default_factory=list)
    hearing_timeline: List[Dict[str, Any]] = Field(default_factory=list)
    hearings: List[HearingRecord] = Field(default_factory=list)
    delay_categories: List[str] = Field(default_factory=list)
    delay_trend: str = Field(default="Stable")
    has_sufficient_historical_data: bool = Field(default=False)
    court_grant_disclaimer: str = Field(
        default="The system does not judge whether an adjournment was legally justified. It only analyzes recorded information."
    )
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class CaseDelayReport(DelayTrackingReport):
    """Alias for Case Delay Report."""
    pass
