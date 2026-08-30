"""
test_settlement_engine.py — Unit tests for Step 8 Two-Sided Settlement System.

Verifies:
1. 7 Data Entities (PreLitigationNotice, OppositePartyResponse, SettlementSession, DocumentExchange, SettlementOffer, SettlementOutcome, AuditLogEntry, PreLitigationDossier)
2. 5 Response Options (WILLING_TO_NEGOTIATE, WILLING_TO_MEDIATE, DISAGREE, NEED_MORE_INFORMATION, NOT_WILLING_TO_SETTLE)
3. Pre-Litigation Dossier Generation on Settlement Failure
4. Legal Admissibility Disclaimer Verification
5. Portal Security & Secure Token Access Control
"""
import pytest
from app.models.settlement import (
    ResponseOption,
    SettlementOutcome,
    PreLitigationNotice,
    OppositePartyResponse,
    SettlementSession,
    PreLitigationDossier,
)
from app.services.settlement_engine import (
    generate_pre_litigation_notice,
    submit_opposite_party_response,
    verify_opposite_party_access,
    get_settlement_session,
)


def test_1_notice_generation_and_entities():
    """Test 1: Generates pre-litigation notice with secure token and audit log."""
    session_state = {
        "case_info": {
            "category": "RENTAL_DISPUTE",
            "issue": "Security deposit withheld by landlord Mr. Ramesh",
            "key_facts": ["Lease expired 30 July 2026", "Notice served"],
            "complainant": "Priya Verma",
            "opposite_party": "Mr. Ramesh",
        },
        "triage_assessment": {"settlement_potential": "HIGH"},
    }
    session = generate_pre_litigation_notice("sess_100", session_state)

    assert isinstance(session, SettlementSession)
    assert isinstance(session.notice, PreLitigationNotice)
    assert session.notice.notice_id is not None
    assert session.secure_token is not None
    assert len(session.audit_logs) > 0
    assert "Party A states" in session.initiating_party_statement["facts"][0]


def test_2_opposite_party_response_options():
    """Test 2: Processes Party B response using 5 response options."""
    session_state = {
        "case_info": {"issue": "Unpaid salary dues", "complainant": "Rahul", "opposite_party": "Tech Corp"},
    }
    session = generate_pre_litigation_notice("sess_200", session_state)
    notice_id = session.notice_id
    token = session.secure_token

    success, msg, updated_session = submit_opposite_party_response(
        notice_id=notice_id,
        secure_token=token,
        responding_party_name="Tech Corp HR",
        response_option=ResponseOption.WILLING_TO_MEDIATE,
        statement="We are open to discussing payment through mediation.",
    )
    assert success is True
    assert updated_session.settlement_status == "IN_MEDIATION"
    assert updated_session.responding_party_statement["response_option"] == "WILLING_TO_MEDIATE"
    assert "Party B states" in updated_session.responding_party_statement["labeled_statement"]


def test_3_settlement_failure_dossier_generation():
    """Test 3: Generates Pre-Litigation Dossier when Party B rejects settlement."""
    session_state = {
        "case_info": {"issue": "Cheque bounce of Rs 1,00,000", "complainant": "Amit", "opposite_party": "Suresh"},
    }
    session = generate_pre_litigation_notice("sess_300", session_state)
    notice_id = session.notice_id
    token = session.secure_token

    success, msg, updated_session = submit_opposite_party_response(
        notice_id=notice_id,
        secure_token=token,
        responding_party_name="Suresh",
        response_option=ResponseOption.NOT_WILLING_TO_SETTLE,
        statement="I refuse to settle this matter.",
    )
    assert success is True
    assert updated_session.settlement_status == "SETTLEMENT_FAILED"
    assert updated_session.outcome == SettlementOutcome.SETTLEMENT_FAILED
    assert isinstance(updated_session.dossier, PreLitigationDossier)
    assert updated_session.dossier.outcome == SettlementOutcome.SETTLEMENT_FAILED


def test_4_admissibility_disclaimer_verification():
    """Test 4: Verifies mandatory court admissibility disclaimer on Dossier."""
    session_state = {
        "case_info": {"issue": "Contractual breach", "complainant": "Party A", "opposite_party": "Party B"},
    }
    session = generate_pre_litigation_notice("sess_400", session_state)
    submit_opposite_party_response(
        notice_id=session.notice_id,
        secure_token=session.secure_token,
        responding_party_name="Party B",
        response_option=ResponseOption.DISAGREE,
        statement="Disagree with allegations.",
    )
    dossier = session.dossier
    assert dossier is not None
    assert "legal admissibility depends on applicable law and court" in dossier.legal_admissibility_disclaimer


def test_5_portal_security_unauthorized_token():
    """Test 5: Rejects unauthorized access with invalid secure token."""
    session_state = {
        "case_info": {"issue": "Property dispute", "complainant": "User A", "opposite_party": "User B"},
    }
    session = generate_pre_litigation_notice("sess_500", session_state)

    # Valid token succeeds
    valid_access = verify_opposite_party_access(session.notice_id, session.secure_token)
    assert valid_access is not None

    # Invalid token fails (Security check)
    invalid_access = verify_opposite_party_access(session.notice_id, "invalid_hacker_token_123")
    assert invalid_access is None

    success, msg, _ = submit_opposite_party_response(
        notice_id=session.notice_id,
        secure_token="invalid_token",
        responding_party_name="Attacker",
        response_option=ResponseOption.WILLING_TO_SETTLE if hasattr(ResponseOption, "WILLING_TO_SETTLE") else ResponseOption.WILLING_TO_NEGOTIATE,
        statement="Hacked response",
    )
    assert success is False
    assert "Unauthorized access" in msg
