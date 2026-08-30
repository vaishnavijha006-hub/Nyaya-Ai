"""
test_evidence_engine.py — Unit tests for Step 5 Document and Evidence Engine.

Verifies:
1. Category-Aware Document Checklists (Rental vs Cheque Bounce)
2. Text Extraction & Inconsistency Detection (Date mismatch)
3. Missing Document Detection
4. 6-Status Classification (RELEVANT, INCONSISTENT, MISSING, NEEDS_HUMAN_REVIEW, etc.)
5. Authenticity Disclaimer Inclusion
6. Unauthorized Document Access Protection
"""
import pytest
from app.services.evidence_engine import (
    get_category_checklist,
    compare_document_with_case_facts,
    generate_case_evidence_report,
)
from app.models.evidence import DocumentStatus
from fastapi import HTTPException


def test_1_category_aware_checklists():
    """Test 1: Checklists differ based on case category."""
    rental_list = get_category_checklist("RENTAL_DISPUTE")
    cheque_list = get_category_checklist("CHEQUE_BOUNCE")

    rental_names = [d.document_name for d in rental_list]
    cheque_names = [d.document_name for d in cheque_list]

    assert "Rent Agreement" in rental_names
    assert "Rent Payment Proof" in rental_names
    assert "Original Bounced Cheque" in cheque_names
    assert "Bank Return Memo" in cheque_names
    assert "Rent Agreement" not in cheque_names


def test_2_missing_documents_detection():
    """Test 2: Identifies missing mandatory documents."""
    case_info = {"category": "RENTAL_DISPUTE", "incident_date": "18 August"}
    uploaded = [{"filename": "rent_agreement.pdf", "extracted_text": "Lease Agreement terms..."}]

    report = generate_case_evidence_report("RENTAL_DISPUTE", case_info, uploaded)
    assert "Rent Payment Proof" in report.missing_evidence
    assert report.authenticity_disclaimer is not None


def test_3_date_inconsistency_detection():
    """Test 3: Flags date mismatch between case facts and document text."""
    case_info = {"incident_date": "18 August"}
    doc_text = "Notice of Eviction dated 20 August 2026 served upon tenant."

    comp = compare_document_with_case_facts(doc_text, "eviction_notice.pdf", case_info)
    assert comp.status == DocumentStatus.INCONSISTENT
    assert len(comp.inconsistencies) > 0
    assert "Potential inconsistency detected" in comp.inconsistencies[0]


def test_4_authenticity_disclaimer():
    """Test 4: Disclaims legal authenticity verification."""
    case_info = {"category": "RENTAL_DISPUTE"}
    report = generate_case_evidence_report("RENTAL_DISPUTE", case_info, [])
    assert "does NOT verify legal authenticity" in report.authenticity_disclaimer


def test_5_unreadable_document_needs_review():
    """Test 5: Low quality or unreadable document marked NEEDS_HUMAN_REVIEW."""
    case_info = {"category": "CHEQUE_BOUNCE"}
    doc_text = "Unable to extract readable text from document."

    comp = compare_document_with_case_facts(doc_text, "blurry_cheque.png", case_info)
    assert comp.status == DocumentStatus.NEEDS_HUMAN_REVIEW
    assert "manual lawyer review" in comp.findings[0]


def test_6_unauthorized_document_access():
    """Test 6: Cross-user access control protects document endpoints."""
    from app.services.journey_state import get_state, reset_session
    session_id = "doc_sess_999"
    reset_session(session_id)

    # User A owns session
    get_state(session_id, user_id="user_a")

    # User B attempts access -> 403 Forbidden
    with pytest.raises(HTTPException) as exc_info:
        get_state(session_id, user_id="user_b")
    assert exc_info.value.status_code == 403
    assert "Cross-user access attempt denied" in exc_info.value.detail
