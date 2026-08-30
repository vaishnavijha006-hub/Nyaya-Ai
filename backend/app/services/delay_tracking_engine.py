"""
delay_tracking_engine.py — Case Delay Intelligence & Adjournment Impact Engine.

Tracks filing dates, hearing dates, adjournments, reasons, time between hearings, and total case age.
Calculates estimated adjournment impact without presenting estimates as guaranteed.
Enforces non-judgment guardrail: "The system does not judge whether an adjournment was legally justified. It only analyzes recorded information."
"""
import uuid
import logging
from datetime import datetime, timezone, date
from typing import Dict, Any, Optional, List
from app.models.delay_tracking import (
    AdjournmentRecord,
    HearingRecord,
    DelayTrackingReport,
    CaseDelayReport,
)

logger = logging.getLogger(__name__)


def calculate_days_between(date_str_1: Optional[str], date_str_2: Optional[str] = None) -> int:
    if not date_str_1:
        return 0
    try:
        d1 = datetime.strptime(date_str_1[:10], "%Y-%m-%d").date()
        if date_str_2:
            d2 = datetime.strptime(date_str_2[:10], "%Y-%m-%d").date()
        else:
            d2 = date.today()
        return max((d2 - d1).days, 0)
    except Exception:
        return 0


def evaluate_case_delay_intelligence(
    case_info: Dict[str, Any],
    hearing_history: Optional[List[Dict[str, Any]]] = None,
    historical_benchmarks: Optional[Dict[str, Any]] = None,
) -> CaseDelayReport:
    """
    Analyzes case history to generate a structured Case Delay Report.
    """
    if hearing_history is None:
        hearing_history = []

    filing_date = case_info.get("filing_date") or case_info.get("cheque_date")
    current_stage = case_info.get("case_stage") or case_info.get("classification_status") or "Pre-Litigation Intake"

    total_elapsed_days = calculate_days_between(filing_date)

    hearings_list: List[HearingRecord] = []
    hearing_timeline: List[Dict[str, Any]] = []
    adjournment_reasons: List[str] = []
    reason_distribution: Dict[str, int] = {}
    adjournment_count = 0
    cumulative_delay_days = 0

    prev_date = filing_date

    for idx, h in enumerate(hearing_history, 1):
        h_id = h.get("hearing_id") or f"h_{idx}_{uuid.uuid4().hex[:6]}"
        h_date = h.get("hearing_date") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        stage = h.get("stage") or current_stage
        outcome = h.get("outcome") or "Completed"

        gap_days = calculate_days_between(prev_date, h_date) if prev_date else 0
        prev_date = h_date

        adj_rec = None
        if outcome == "Adjourned" or h.get("adjournment_reason"):
            adjournment_count += 1
            reason = h.get("adjournment_reason") or "Awaiting reply / counter-affidavit"
            next_h_date = h.get("next_hearing_date")
            requested_by = h.get("requested_by") or "Joint / Unspecified"

            delay_days = calculate_days_between(h_date, next_h_date) if next_h_date else 30
            cumulative_delay_days += delay_days

            if reason not in adjournment_reasons:
                adjournment_reasons.append(reason)
            reason_distribution[reason] = reason_distribution.get(reason, 0) + 1

            adj_rec = AdjournmentRecord(
                adjournment_id=f"adj_{uuid.uuid4().hex[:6]}",
                hearing_date=h_date,
                next_hearing_date=next_h_date,
                reason=reason,
                requested_by=requested_by,
                delay_days=delay_days,
            )

        hearings_list.append(
            HearingRecord(
                hearing_id=h_id,
                hearing_date=h_date,
                stage=stage,
                outcome=outcome,
                adjournment_details=adj_rec,
            )
        )

        hearing_timeline.append({
            "hearing_number": idx,
            "date": h_date,
            "stage": stage,
            "outcome": outcome,
            "days_since_previous": gap_days,
            "adjournment_reason": h.get("adjournment_reason"),
        })

    # Categorize Delays
    delay_categories: List[str] = []
    if any("reply" in r.lower() or "pleading" in r.lower() for r in adjournment_reasons):
        delay_categories.append("Pleading & Written Reply Delays")
    if any("counsel" in r.lower() or "advocate" in r.lower() for r in adjournment_reasons):
        delay_categories.append("Representation Availability Delays")
    if any("summons" in r.lower() or "notice" in r.lower() or "service" in r.lower() for r in adjournment_reasons):
        delay_categories.append("Service of Process Delays")
    if not delay_categories and adjournment_count > 0:
        delay_categories.append("Procedural & Scheduling Delays")

    # Determine Trend
    if adjournment_count == 0:
        delay_trend = "On Track (No Adjournments Recorded)"
    elif adjournment_count <= 2:
        delay_trend = "Moderate Scheduling Delays"
    else:
        delay_trend = "High Recurrent Adjournment Pattern"

    # Adjournment Impact Calculator (Strict "Estimated Impact" Phrasing)
    has_sufficient_data = False
    estimated_impact = "Estimated impact: Historical benchmark data is insufficient to calculate expected stage delay."
    estimated_note = "Historical data is insufficient to estimate expected delay."

    if historical_benchmarks and isinstance(historical_benchmarks, dict):
        sample_size = historical_benchmarks.get("sample_size", 0)
        avg_stage_days = historical_benchmarks.get("average_stage_days")

        if sample_size >= 30 and avg_stage_days is not None:
            has_sufficient_data = True
            min_est = int(avg_stage_days * 0.85)
            max_est = int(avg_stage_days * 1.25)
            estimated_impact = (
                f"Estimated impact: Based on historical data (n={sample_size}), "
                f"this stage has an estimated impact of {min_est} to {max_est} additional days."
            )
            estimated_note = estimated_impact
    elif adjournment_count > 0:
        est_avg = int(cumulative_delay_days / adjournment_count) if adjournment_count > 0 else 30
        estimated_impact = (
            f"Estimated impact: Based on recorded case history, each adjournment adds an estimated impact of approximately {est_avg} days."
        )
        estimated_note = estimated_impact

    report_id = f"delay_{uuid.uuid4().hex[:8]}"

    return CaseDelayReport(
        report_id=report_id,
        filing_date=filing_date,
        total_case_age=f"{total_elapsed_days} days",
        total_case_age_days=total_elapsed_days,
        total_elapsed_days=total_elapsed_days,
        number_of_hearings=len(hearings_list),
        total_hearings=len(hearings_list),
        number_of_adjournments=adjournment_count,
        recorded_delay=f"{cumulative_delay_days} days",
        cumulative_adjournment_delay_days=cumulative_delay_days,
        estimated_impact=estimated_impact,
        estimated_delay_impact_note=estimated_note,
        reason_distribution=reason_distribution,
        adjournment_reasons=adjournment_reasons,
        hearing_timeline=hearing_timeline,
        hearings=hearings_list,
        delay_categories=delay_categories,
        delay_trend=delay_trend,
        has_sufficient_historical_data=has_sufficient_data,
        court_grant_disclaimer=(
            "The system does not judge whether an adjournment was legally justified. It only analyzes recorded information."
        ),
        metadata={
            "category": case_info.get("category"),
            "filing_date": filing_date,
            "has_sufficient_historical_data": has_sufficient_data,
        },
    )
