"""
test_action_plan_generator.py — Unit tests for Step 16 Action Plan Engine.

Verifies:
1. Complete 16-section Nyaya AI Action Plan (Title: "YOUR NYAYA AI ACTION PLAN")
2. Structured Progression Flow (WHAT HAPPENED -> WHAT MAY APPLY -> WHAT YOU HAVE -> WHAT IS MISSING -> WHAT YOU CAN CONSIDER DOING NEXT)
3. Traceability & "Why am I seeing this recommendation?" Functionality
4. Non-Guaranteed Legal Outcome Disclaimers
"""
import pytest
from app.models.action_plan import NyayaAIActionPlan
from app.services.action_plan_generator import (
    generate_action_plan,
    explain_recommendation_why,
)


def test_16_section_action_plan_structure():
    """Test 1: Generates complete NyayaAIActionPlan with 16 sections, progression flow, and rationales."""
    session_state = {
        "case_info": {
            "category": "CHEQUE_BOUNCE",
            "sub_category": "Section 138 NI Act",
            "issue": "Cheque dishonoured due to insufficient funds",
            "complainant": "Rajesh Kumar",
            "parties": "Vikram Singh",
            "location": "Delhi",
            "urgency": "High",
            "key_facts": ["Cheque for Rs 150000 issued on 10 July 2026", "Return memo on 15 July 2026"],
            "missing_information": ["Notice delivery proof"],
        },
        "legal_analysis": {
            "applicable_laws": [{"act": "Negotiable Instruments Act, 1881", "section": "Section 138"}],
            "relevant_judgments": [{"case_name": "Dashrath Rupsingh Rathod v. State of Maharashtra", "court_year": "SC 2014"}],
        },
        "triage_assessment": {
            "case_readiness": "READY",
            "settlement_potential": "HIGH",
            "reasons": ["Dispute involves clear monetary debt"],
        },
        "case_package": {
            "completeness_status": "COMPLETE",
            "consistency_warnings": ["Check return memo date"],
        },
        "cluster_detection": {
            "cluster_detected": True,
            "cluster_size": 3,
        },
        "pattern_report": {
            "common_issue": "Multiple dishonoured cheques reported for counterparty",
        },
        "pil_suitability": {
            "potential_pil": False,
            "public_interest_factors": [],
        },
        "legal_aid_assessment": {
            "status": "Eligible",
            "matched_criteria": ["Section 12(c) - Woman applicant"],
            "appropriate_authority": {"authority_name": "DLSA South Delhi"},
        },
        "adr_analysis": {
            "adr_outcome": "LOK_ADALAT_REVIEW",
            "suitability_explanation": "Based on the available information, this dispute may be suitable for an ADR pathway.",
        },
        "documents_uploaded": [{"filename": "cheque_copy.pdf"}],
    }

    plan = generate_action_plan(session_state)

    assert isinstance(plan, NyayaAIActionPlan)
    assert plan.title == "YOUR NYAYA AI ACTION PLAN"
    assert plan.your_issue == "Cheque dishonoured due to insufficient funds"
    assert plan.case_completeness["status"] == "READY"
    assert plan.settlement_possibility == "HIGH"
    assert plan.legal_aid_eligibility["status"] == "Eligible"
    assert plan.cluster_indication["detected"] is True

    # Concise Flow Check
    assert plan.what_happened != ""
    assert len(plan.what_may_apply) >= 1
    assert len(plan.what_you_have) >= 1
    assert len(plan.what_is_missing) >= 1
    assert len(plan.what_you_can_consider_doing_next) >= 1

    # Traceability & "Why am I seeing this recommendation?" Check
    assert len(plan.recommendation_rationales) >= 2
    why_text = explain_recommendation_why("DLSA", plan)
    assert "Why am I seeing this recommendation?" in why_text


def test_action_plan_disclaimer():
    """Test 2: Verifies non-guaranteed legal outcome disclaimers."""
    session_state = {
        "case_info": {
            "category": "RENTAL_DISPUTE",
            "issue": "Security deposit refund delay",
            "location": "Noida",
        },
    }
    plan = generate_action_plan(session_state)

    assert "provides legal information, NOT guaranteed legal outcomes" in plan.ai_disclaimer
    assert plan.requires_human_review is True
