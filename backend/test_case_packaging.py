"""
test_case_packaging.py — Unit tests for Step 9 Judge-Ready Case Packaging Engine.

Verifies:
1. 13 Required Case Package Elements
2. Issue-Evidence Matrix
3. Completeness Checker (INCOMPLETE status vs Preliminary passed disclaimer)
4. Non-Guarantee Framing ("Preliminary completeness check passed", never claims "Legally ready to file")
"""
import pytest
from app.models.case_package import StructuredCasePackage
from app.services.case_packaging import generate_structured_case_package


def test_1_full_13_part_judge_ready_package():
    """Test 1: Complete case generates all 13 items with preliminary completeness disclaimer."""
    session_state = {
        "session_id": "test_sess_999",
        "case_info": {
            "category": "CHEQUE_BOUNCE",
            "sub_category": "Dishonoured Cheque",
            "issue": "Cheque dishonoured due to insufficient funds",
            "complainant": "Rajesh Kumar",
            "parties": "Vikram Singh",
            "location": "Delhi",
            "urgency": "High",
            "desired_outcome": "Recovery of cheque amount Rs 150,000",
            "key_facts": ["Cheque for Rs 150,000 issued on 10 July 2026", "Dishonour memo received 15 July 2026"],
            "cheque_date": "2026-07-10",
            "return_memo_date": "2026-07-15",
            "classification_status": "COMPLETE",
        },
        "legal_analysis": {
            "applicable_laws": [{"act": "Negotiable Instruments Act, 1881", "section": "Section 138"}],
            "relevant_judgments": [{"case_name": "Dashrath Rupsingh Rathod v. State of Maharashtra", "court_year": "Supreme Court 2014"}],
        },
        "documents_uploaded": [{"filename": "cheque_copy.pdf"}, {"filename": "bank_return_memo.pdf"}],
        "documents_verified": True,
    }

    pkg = generate_structured_case_package(session_state)
    assert isinstance(pkg, StructuredCasePackage)
    assert pkg.completeness_status == "COMPLETE"
    assert "Preliminary completeness check passed" in pkg.court_compliance_disclaimer
    assert "Legally ready to file" not in pkg.court_compliance_disclaimer

    # Verify 13 elements:
    assert "category" in pkg.case_summary
    assert "complainant_applicant" in pkg.parties
    assert len(pkg.chronology) >= 1
    assert len(pkg.issues) >= 1
    assert len(pkg.claims) >= 1
    assert pkg.relief_requested is not None
    assert len(pkg.evidence_list) == 2
    assert len(pkg.issue_evidence_matrix) >= 1
    assert len(pkg.annexure_list) == 2
    assert isinstance(pkg.missing_documents, list)
    assert isinstance(pkg.potential_inconsistencies, list)
    assert pkg.limitation_warning is not None
    assert "heading" in pkg.draft_pleading


def test_2_incomplete_case_package():
    """Test 2: Missing mandatory information returns INCOMPLETE status."""
    session_state = {
        "case_info": {
            "category": "RENTAL_DISPUTE",
            "issue": "Locked out of apartment",
            "missing_information": ["lockout_date", "rent_agreement_exists"],
            "classification_status": "INCOMPLETE",
        },
        "documents_uploaded": [],
    }

    pkg = generate_structured_case_package(session_state)
    assert pkg.completeness_status == "INCOMPLETE"
    assert "Status: INCOMPLETE" in pkg.court_compliance_disclaimer
    assert len(pkg.missing_documents) > 0
