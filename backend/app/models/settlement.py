"""
settlement.py — Data models for Step 8 Two-Sided Pre-Litigation Settlement System.
"""
from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class ResponseOption(str, Enum):
    WILLING_TO_NEGOTIATE = "WILLING_TO_NEGOTIATE"
    WILLING_TO_MEDIATE = "WILLING_TO_MEDIATE"
    DISAGREE = "DISAGREE"
    NEED_MORE_INFORMATION = "NEED_MORE_INFORMATION"
    NOT_WILLING_TO_SETTLE = "NOT_WILLING_TO_SETTLE"


class DocumentExchange(BaseModel):
    exchange_id: str
    uploaded_by: str  # "Party A" or "Party B"
    document_name: str
    document_url: str
    uploaded_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SettlementOffer(BaseModel):
    offer_id: str
    offered_by: str  # "Party A" or "Party B"
    offered_amount: Optional[float] = None
    terms_summary: str
    expires_at: Optional[str] = None
    is_accepted: Optional[bool] = None


class SettlementOutcome(str, Enum):
    SETTLEMENT_ACHIEVED = "SETTLEMENT_ACHIEVED"
    SETTLEMENT_FAILED = "SETTLEMENT_FAILED"
    IN_PROGRESS = "IN_PROGRESS"


class AuditLogEntry(BaseModel):
    log_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    action: str
    actor_role: str  # "Party A", "Party B", "System", "Mediator"
    details: str


class PreLitigationNotice(BaseModel):
    notice_id: str
    session_id: str
    secure_token: str
    notice_title: str = Field(default="Pre-Litigation Settlement Notice")
    initiating_party_label: str = Field(default="Party A (Initiating Party)")
    opposite_party_label: str = Field(default="Party B (Opposite Party)")
    parties: Dict[str, str] = Field(default_factory=dict)
    facts_provided_by_initiating_user: List[str] = Field(default_factory=list)
    dispute_summary: str
    requested_resolution: str
    supporting_documents: List[str] = Field(default_factory=list)
    response_mechanism_url: str
    notice_disclaimer: str = Field(
        default="Notice Framing: Party A states the following facts for pre-litigation settlement exploration. This notice is an invitation for pre-litigation dialogue and does not constitute a judicial ruling or binding court order."
    )
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class OppositePartyResponse(BaseModel):
    response_id: str
    notice_id: str
    responding_party_name: str
    response_option: ResponseOption
    responding_party_statement: str
    accepted_terms: List[str] = Field(default_factory=list)
    counter_proposal: Optional[str] = None
    submitted_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PreLitigationDossier(BaseModel):
    dossier_id: str
    notice_id: str
    original_claim: Dict[str, Any]
    opposite_party_response: Optional[Dict[str, Any]] = None
    relevant_documents: List[DocumentExchange] = Field(default_factory=list)
    timeline: List[Dict[str, str]] = Field(default_factory=list)
    settlement_attempts: List[SettlementOffer] = Field(default_factory=list)
    outcome: SettlementOutcome
    legal_admissibility_disclaimer: str = Field(
        default="This record may help organize evidence of pre-litigation communication; legal admissibility depends on applicable law and court."
    )
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SettlementSession(BaseModel):
    settlement_id: str
    session_id: str
    notice_id: str
    secure_token: str
    initiating_party_statement: Dict[str, Any]
    responding_party_statement: Optional[Dict[str, Any]] = None
    settlement_status: str = Field(default="NOTICE_ISSUED")
    outcome: SettlementOutcome = Field(default=SettlementOutcome.IN_PROGRESS)
    notice: PreLitigationNotice
    responses: List[OppositePartyResponse] = Field(default_factory=list)
    document_exchanges: List[DocumentExchange] = Field(default_factory=list)
    settlement_offers: List[SettlementOffer] = Field(default_factory=list)
    audit_logs: List[AuditLogEntry] = Field(default_factory=list)
    dossier: Optional[PreLitigationDossier] = None
    privacy_and_consent: Dict[str, Any] = Field(default_factory=lambda: {
        "initiating_party_consent": True,
        "privacy_protected": True,
        "voluntary_mediation": True,
    })
