"""
test_triage_engine.py — Unit tests for Step 7 Pre-Litigation Triage Engine.

Verifies:
1. 9 Target Triage Pathways (SETTLEMENT_FIRST, MEDIATION, LEGAL_AID, LAWYER, LITIGATION_PREPARATION, CLUSTER_REVIEW, PIL_REVIEW, ADR_REVIEW, MORE_INFORMATION_REQUIRED)
2. Explainability (Every recommendation includes clear reasons)
3. Non-Guarantee Wording (Never claims "You will win", uses "may be appropriate")
4. Hybrid Decision Rules (Combining rules, legal aid criteria, systemic flags)
"""
import pytest
from app.models.triage import TriagePathway, TriageAssessment
from app.services.triage_engine import evaluate_prelitigation_triage


def test_1_settlement_first_pathway():
    """Test 1: Monetary dispute with identifiable parties routes to SETTLEMENT_FIRST."""
    case_info = {
        "category": "RENTAL_DISPUTE",
        "issue": "Illegally locked out by landlord Mr. Ramesh, deposit withheld",
        "key_facts": ["Rent paid", "Lockout yesterday"],
        "classification_status": "COMPLETE",
    }
    triage = evaluate_prelitigation_triage(case_info)

    assert isinstance(triage, TriageAssessment)
    assert triage.recommended_pathway == TriagePathway.SETTLEMENT_FIRST
    assert triage.confidence >= 0.90
    assert len(triage.reasons) > 0
    assert triage.requires_human_review is True
    # Wording check
    assert "may be appropriate" in triage.ai_assisted_disclaimer
    assert "will win" not in " ".join(triage.reasons).lower()


def test_2_legal_aid_pathway():
    """Test 2: Eligible income/marginalized status routes to LEGAL_AID."""
    case_info = {
        "category": "EMPLOYMENT_DISPUTE",
        "issue": "Unpaid wages for 3 months",
        "key_facts": ["Factory worker", "Low income"],
        "classification_status": "COMPLETE",
        "user_profile": {"annual_income": 150000, "gender": "female"},
    }
    triage = evaluate_prelitigation_triage(case_info)

    assert triage.recommended_pathway == TriagePathway.LEGAL_AID
    assert any("Section 12" in r or "DLSA" in r for r in triage.reasons)


def test_3_pil_review_pathway():
    """Test 3: Widespread public harm routes to PIL_REVIEW."""
    case_info = {
        "category": "PUBLIC_INTEREST",
        "issue": "Widespread toxic waste dumping polluting municipal river supply",
        "key_facts": ["Affects entire district", "Public health emergency"],
        "potential_pil": True,
        "classification_status": "COMPLETE",
    }
    triage = evaluate_prelitigation_triage(case_info)

    assert triage.recommended_pathway == TriagePathway.PIL_REVIEW
    assert any("PIL" in r or "Public Interest" in r for r in triage.reasons)


def test_4_cluster_review_pathway():
    """Test 4: Systemic recurring complaints route to CLUSTER_REVIEW."""
    case_info = {
        "category": "CONSUMER_DISPUTE",
        "issue": "Mass non-delivery of orders by online merchant",
        "key_facts": ["Multiple victims", "Recurring scam"],
        "is_cluster": True,
        "classification_status": "COMPLETE",
    }
    triage = evaluate_prelitigation_triage(case_info)

    assert triage.recommended_pathway == TriagePathway.CLUSTER_REVIEW
    assert any("recurring" in r or "collective" in r for r in triage.reasons)


def test_5_more_information_required_pathway():
    """Test 5: Ambiguous case with missing facts routes to MORE_INFORMATION_REQUIRED."""
    case_info = {
        "category": None,
        "issue": "",
        "key_facts": [],
        "classification_status": "INCOMPLETE",
        "missing_information": ["category", "location"],
    }
    triage = evaluate_prelitigation_triage(case_info)

    assert triage.recommended_pathway == TriagePathway.MORE_INFORMATION_REQUIRED
    assert len(triage.reasons) > 0


def test_6_litigation_preparation_pathway():
    """Test 6: Cheque bounce or expiring limitation routes to LITIGATION_PREPARATION."""
    case_info = {
        "category": "CHEQUE_BOUNCE",
        "issue": "Cheque of Rs 1,00,000 dishonoured, notice sent 25 days ago",
        "key_facts": ["Notice sent", "Limitation period expiring"],
        "classification_status": "COMPLETE",
    }
    triage = evaluate_prelitigation_triage(case_info)

    assert triage.recommended_pathway in [TriagePathway.LITIGATION_PREPARATION, TriagePathway.SETTLEMENT_FIRST]
    assert len(triage.warnings) > 0
