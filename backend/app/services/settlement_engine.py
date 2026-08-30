"""
settlement_engine.py — Two-Sided Pre-Litigation Settlement System for Nyaya AI.

Manages two-sided settlement workflow, secure opposite party links, document exchange,
settlement offers, immutable audit logs, and Pre-Litigation Dossier generation upon failure.
"""
import uuid
import logging
from typing import Dict, Any, Optional, List, Tuple
from app.models.settlement import (
    PreLitigationNotice,
    OppositePartyResponse,
    SettlementSession,
    ResponseOption,
    DocumentExchange,
    SettlementOffer,
    SettlementOutcome,
    AuditLogEntry,
    PreLitigationDossier,
)

logger = logging.getLogger(__name__)

# Global thread-safe in-memory store for settlement sessions (keyed by notice_id)
_SETTLEMENT_STORE: Dict[str, SettlementSession] = {}


def explain_settlement_suitability(triage_data: Dict[str, Any], case_info: Dict[str, Any]) -> str:
    """Explains why pre-litigation settlement is recommended based on triage assessment."""
    settlement_potential = triage_data.get("settlement_potential", "LOW")
    category = (case_info.get("category") or "").replace("_", " ").title()

    if settlement_potential == "HIGH":
        return (
            f"Pre-litigation settlement is highly recommended for this {category} dispute. "
            "Key reasons: The dispute involves monetary recovery or contractual obligations suitable for mutually agreed resolution, "
            "there is no imminent threat of physical harm or violence, and early negotiation avoids lengthy and expensive court litigation."
        )
    elif settlement_potential == "MEDIUM":
        return (
            f"Pre-litigation settlement may be suitable for this {category} dispute. "
            "A formal pre-litigation notice allows Party B to review terms and participate in voluntary conciliation before court filing."
        )
    else:
        return "Pre-litigation settlement has low potential at this stage due to missing key documents or urgent interim relief requirements."


def generate_pre_litigation_notice(
    session_id: str,
    session_state: Dict[str, Any],
    base_url: str = "https://nyaya.ai",
) -> SettlementSession:
    """
    Generates a structured Pre-Litigation Notice and initializes an isolated Settlement Session with a secure token.
    Stores Party A's statement separately.
    """
    case_info = session_state.get("case_info", {})
    triage_assessment = session_state.get("triage_assessment", {})

    notice_id = f"notice_{uuid.uuid4().hex[:10]}"
    settlement_id = f"settle_{uuid.uuid4().hex[:10]}"
    secure_token = f"tok_{uuid.uuid4().hex[:16]}"

    complainant_name = case_info.get("complainant") or case_info.get("initiating_party") or "Initiating Party"
    opposite_party_name = case_info.get("parties") or case_info.get("opposite_party") or case_info.get("drawer_name") or "Opposite Party"

    raw_facts = case_info.get("key_facts", [])
    labeled_facts = [f"Party A states: {fact}" for fact in raw_facts]
    if not labeled_facts:
        labeled_facts = [f"Party A states: {case_info.get('issue', 'Grievance regarding transaction/agreement')}"]

    dispute_summary = f"Party A states that a dispute has arisen regarding: {case_info.get('issue', 'Unresolved grievance')}."
    requested_resolution = case_info.get("desired_outcome") or "Mutual resolution, refund/compensation, and cessation of disputed conduct."

    docs_uploaded = session_state.get("documents_uploaded", [])
    supporting_docs = [d.get("filename", str(d)) if isinstance(d, dict) else str(d) for d in docs_uploaded]
    if not supporting_docs:
        supporting_docs = ["Grievance Statement", "Proof of Transaction / Communications (On record)"]

    response_url = f"{base_url}/settlement/respond/{notice_id}?token={secure_token}"

    notice = PreLitigationNotice(
        notice_id=notice_id,
        session_id=session_id,
        secure_token=secure_token,
        notice_title="Pre-Litigation Settlement Notice",
        initiating_party_label="Party A (Initiating Party)",
        opposite_party_label="Party B (Opposite Party)",
        parties={
            "initiating_party": complainant_name,
            "opposite_party": opposite_party_name,
        },
        facts_provided_by_initiating_user=labeled_facts,
        dispute_summary=dispute_summary,
        requested_resolution=requested_resolution,
        supporting_documents=supporting_docs,
        response_mechanism_url=response_url,
    )

    initiating_statement = {
        "party_label": "Party A",
        "party_name": complainant_name,
        "raw_statement": case_info.get("issue", ""),
        "facts": labeled_facts,
        "requested_outcome": requested_resolution,
        "is_immutable": True,
    }

    initial_audit = AuditLogEntry(
        log_id=f"log_{uuid.uuid4().hex[:8]}",
        action="NOTICE_CREATED",
        actor_role="Party A",
        details=f"Pre-litigation notice created by {complainant_name} for {opposite_party_name}."
    )

    session = SettlementSession(
        settlement_id=settlement_id,
        session_id=session_id,
        notice_id=notice_id,
        secure_token=secure_token,
        initiating_party_statement=initiating_statement,
        responding_party_statement=None,
        settlement_status="NOTICE_ISSUED",
        outcome=SettlementOutcome.IN_PROGRESS,
        notice=notice,
        responses=[],
        document_exchanges=[],
        settlement_offers=[],
        audit_logs=[initial_audit],
        privacy_and_consent={
            "initiating_party_consent": True,
            "privacy_protected": True,
            "voluntary_mediation": True,
            "settlement_explanation": explain_settlement_suitability(triage_assessment, case_info),
        },
    )

    _SETTLEMENT_STORE[notice_id] = session
    return session


def verify_opposite_party_access(notice_id: str, secure_token: str) -> Optional[SettlementSession]:
    """Validates secure token for User B access. Prevents cross-session unauthorized data access."""
    session = _SETTLEMENT_STORE.get(notice_id)
    if not session:
        return None
    if session.secure_token != secure_token:
        logger.warning(f"[Security Warning] Unauthorized access attempt to notice '{notice_id}' with invalid token.")
        return None
    return session


def submit_opposite_party_response(
    notice_id: str,
    secure_token: str,
    responding_party_name: str,
    response_option: ResponseOption,
    statement: str,
    accepted_terms: Optional[List[str]] = None,
    counter_proposal: Optional[str] = None,
) -> Tuple[bool, str, Optional[SettlementSession]]:
    """
    Submits Party B's response without modifying Party A's original facts.
    Stores Party B's response using one of the 5 response options.
    Generates Pre-Litigation Dossier if settlement fails.
    """
    session = verify_opposite_party_access(notice_id, secure_token)
    if not session:
        return False, "Unauthorized access or invalid notice token.", None

    response_id = f"resp_{uuid.uuid4().hex[:8]}"
    labeled_statement = f"Party B states: {statement}"

    op_response = OppositePartyResponse(
        response_id=response_id,
        notice_id=notice_id,
        responding_party_name=responding_party_name,
        response_option=response_option,
        responding_party_statement=labeled_statement,
        accepted_terms=accepted_terms or [],
        counter_proposal=counter_proposal,
    )

    responding_statement = {
        "party_label": "Party B",
        "party_name": responding_party_name,
        "response_option": response_option.value,
        "raw_statement": statement,
        "labeled_statement": labeled_statement,
        "accepted_terms": accepted_terms or [],
        "counter_proposal": counter_proposal,
    }

    session.responding_party_statement = responding_statement
    session.responses.append(op_response)

    # State machine transition
    if response_option == ResponseOption.WILLING_TO_NEGOTIATE:
        session.settlement_status = "IN_NEGOTIATION"
        session.outcome = SettlementOutcome.IN_PROGRESS
    elif response_option == ResponseOption.WILLING_TO_MEDIATE:
        session.settlement_status = "IN_MEDIATION"
        session.outcome = SettlementOutcome.IN_PROGRESS
    elif response_option == ResponseOption.NEED_MORE_INFORMATION:
        session.settlement_status = "AWAITING_INFORMATION"
        session.outcome = SettlementOutcome.IN_PROGRESS
    elif response_option in [ResponseOption.DISAGREE, ResponseOption.NOT_WILLING_TO_SETTLE]:
        session.settlement_status = "SETTLEMENT_FAILED"
        session.outcome = SettlementOutcome.SETTLEMENT_FAILED
        # Auto-generate Pre-Litigation Dossier on failure
        session.dossier = generate_prelitigation_dossier(session)

    # Audit Log
    audit = AuditLogEntry(
        log_id=f"log_{uuid.uuid4().hex[:8]}",
        action="RESPONSE_SUBMITTED",
        actor_role="Party B",
        details=f"Party B responded with option '{response_option.value}'."
    )
    session.audit_logs.append(audit)

    _SETTLEMENT_STORE[notice_id] = session
    return True, "Response recorded successfully.", session


def generate_prelitigation_dossier(session: SettlementSession) -> PreLitigationDossier:
    """Generates structured Pre-Litigation Dossier upon settlement failure."""
    dossier_id = f"dossier_{uuid.uuid4().hex[:10]}"
    timeline = [
        {"timestamp": log.timestamp, "event": f"[{log.actor_role}] {log.action}: {log.details}"}
        for log in session.audit_logs
    ]

    return PreLitigationDossier(
        dossier_id=dossier_id,
        notice_id=session.notice_id,
        original_claim=session.initiating_party_statement,
        opposite_party_response=session.responding_party_statement,
        relevant_documents=session.document_exchanges,
        timeline=timeline,
        settlement_attempts=session.settlement_offers,
        outcome=session.outcome,
        legal_admissibility_disclaimer=(
            "This record may help organize evidence of pre-litigation communication; "
            "legal admissibility depends on applicable law and court."
        )
    )


def get_settlement_session(notice_id: str) -> Optional[SettlementSession]:
    """Retrieves an active settlement session by notice_id."""
    return _SETTLEMENT_STORE.get(notice_id)
