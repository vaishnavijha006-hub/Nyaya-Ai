"""
test_delay_tracking_engine.py — Unit tests for Step 15 Case Delay Intelligence Module.

Verifies:
1. Delay Metrics (total case age, number of hearings, number of adjournments, recorded delay)
2. Hearing Timeline & Reason Distribution
3. Adjournment Impact Calculator ("Estimated impact" framing without guaranteed day predictions)
4. Non-Judgment Guardrail Disclaimer ("The system does not judge whether an adjournment was legally justified.")
"""
import pytest
from app.models.delay_tracking import DelayTrackingReport, CaseDelayReport
from app.services.delay_tracking_engine import evaluate_case_delay_intelligence


def test_1_case_delay_report_metrics():
    """Test 1: Generates complete Case Delay Report with all required metrics."""
    case_info = {
        "filing_date": "2026-01-10",
        "case_stage": "Evidence Stage",
        "category": "CHEQUE_BOUNCE",
    }
    hearing_history = [
        {
            "hearing_date": "2026-02-15",
            "stage": "Pleading",
            "outcome": "Completed",
        },
        {
            "hearing_date": "2026-03-20",
            "next_hearing_date": "2026-05-10",
            "stage": "Framing of Issues",
            "outcome": "Adjourned",
            "adjournment_reason": "Counsel absent",
            "requested_by": "Party B",
        },
        {
            "hearing_date": "2026-05-10",
            "next_hearing_date": "2026-06-25",
            "stage": "Evidence Stage",
            "outcome": "Adjourned",
            "adjournment_reason": "Non-service of summons",
            "requested_by": "Court",
        },
    ]

    report = evaluate_case_delay_intelligence(case_info, hearing_history)

    assert isinstance(report, CaseDelayReport)
    assert report.total_case_age != ""
    assert report.number_of_hearings == 3
    assert report.number_of_adjournments == 2
    assert report.recorded_delay != ""
    assert "Counsel absent" in report.reason_distribution
    assert "Non-service of summons" in report.reason_distribution
    assert len(report.hearing_timeline) == 3
    assert len(report.delay_categories) >= 1
    assert report.delay_trend != ""


def test_2_estimated_impact_phrasing():
    """Test 2: Uses 'Estimated impact' phrasing and avoids guaranteed delay claims."""
    case_info = {"filing_date": "2026-01-01"}
    benchmarks = {
        "sample_size": 45,
        "average_stage_days": 60,
    }
    report = evaluate_case_delay_intelligence(case_info, historical_benchmarks=benchmarks)

    assert "Estimated impact" in report.estimated_impact
    assert "will delay your case by exactly" not in report.estimated_impact.lower()


def test_3_non_judgment_guardrail():
    """Test 3: Verifies system does not judge whether adjournment was legally justified."""
    case_info = {"filing_date": "2026-02-01"}
    report = evaluate_case_delay_intelligence(case_info)

    assert "does not judge whether an adjournment was legally justified" in report.court_grant_disclaimer
