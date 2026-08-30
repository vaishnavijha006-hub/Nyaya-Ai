"""
test_legal_aid_enhanced.py — Unit tests for Step 13 Legal Aid + DLSA Engine.

Verifies:
1. Deterministic Rule Execution (No LLM in final eligibility decision)
2. 4 Outcomes (Eligible, Potentially Eligible, Not Eligible Based on Available Information, Insufficient Information)
3. Criteria Explanations (Section 12(a), Section 12(c), Section 12(h), etc.)
4. Guidance (What to do next, Documents to prepare, DLSA Pathway, Location Guidance)
5. Reliable Data (No fake DLSA phone numbers or unverified contact data)
"""
import pytest
from app.models.legal_aid_enhanced import LegalAidAssessment, LegalAidStatus
from app.services.legal_aid_eligibility import evaluate_legal_aid_deterministic


def test_1_status_eligible():
    """Test 1: SC/ST Woman applicant evaluates deterministically to status = 'Eligible'."""
    profile = {
        "gender": "Female",
        "caste_category": "SC",
        "annual_income": 150000,
        "state": "Delhi",
        "district": "South Delhi",
    }
    res = evaluate_legal_aid_deterministic(profile)

    assert isinstance(res, LegalAidAssessment)
    assert res.status == LegalAidStatus.ELIGIBLE
    assert len(res.matched_criteria) >= 2
    assert any("Section 12(a)" in c for c in res.matched_criteria)
    assert any("Section 12(c)" in c for c in res.matched_criteria)
    assert len(res.what_to_do_next) >= 4
    assert len(res.documents_to_prepare) >= 5
    assert "District Legal Services Authority" in res.legal_services_authority_pathway
    assert res.location_specific_guidance["national_helpline"] == "15100 (NALSA Toll-Free Helpline)"
    assert res.is_deterministic is True


def test_2_status_potentially_eligible():
    """Test 2: Income near threshold or OBC category evaluates to 'Potentially Eligible'."""
    profile = {
        "gender": "Male",
        "caste_category": "OBC",
        "annual_income": 320000,
        "state": "Uttar Pradesh",
        "district": "Noida",
    }
    res = evaluate_legal_aid_deterministic(profile)

    assert res.status == LegalAidStatus.POTENTIALLY_ELIGIBLE
    assert "Potentially Eligible" in res.explanation
    assert len(res.documents_to_prepare) >= 5


def test_3_status_not_eligible():
    """Test 3: High income male without statutory category evaluates to 'Not Eligible Based on Available Information'."""
    profile = {
        "gender": "Male",
        "caste_category": "General",
        "annual_income": 800000,
        "state": "Maharashtra",
        "district": "Mumbai",
    }
    res = evaluate_legal_aid_deterministic(profile)

    assert res.status == LegalAidStatus.NOT_ELIGIBLE
    assert "exceeds statutory legal aid threshold" in res.explanation


def test_4_status_insufficient_information():
    """Test 4: Missing profile details evaluates to 'Insufficient Information'."""
    profile = {
        "gender": None,
        "caste_category": None,
        "annual_income": None,
    }
    res = evaluate_legal_aid_deterministic(profile)

    assert res.status == LegalAidStatus.INSUFFICIENT_INFO
    assert len(res.missing_information) >= 2
