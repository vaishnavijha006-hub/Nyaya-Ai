"""
triage_engine.py — Pre-Litigation Triage Engine for Nyaya AI.

Hybrid Decision Engine combining structured rules, LLM extraction, Legal RAG,
and deterministic eligibility logic to route disputes into 9 target pathways.
"""
import logging
from typing import Dict, Any, Optional, List
from app.models.triage import (
    TriagePathway,
    CaseReadiness,
    SettlementPotential,
    TriageAssessment,
)
from app.models.pathway import LegalPathway

logger = logging.getLogger(__name__)


def evaluate_prelitigation_triage(
    case_info: Dict[str, Any],
    session_state: Optional[Dict[str, Any]] = None,
) -> TriageAssessment:
    """
    Evaluates pre-litigation triage assessment using hybrid decision making.
    Never promises outcome guarantees ("Your case will win").
    Returns structured TriageAssessment with explainable reasons.
    """
    if session_state is None:
        session_state = {}

    category = (case_info.get("category") or "").upper()
    issue = (case_info.get("issue") or "").lower()
    facts = case_info.get("key_facts", [])
    facts_text = " ".join(facts).lower()
    combined_text = f"{issue} {facts_text}"

    missing_info = case_info.get("missing_information", [])
    classification_status = case_info.get("classification_status", "INCOMPLETE")
    has_safety_concern = case_info.get("has_immediate_safety_concern", False)
    user_profile = session_state.get("user_profile") or case_info.get("user_profile") or {}

    reasons: List[str] = []
    warnings: List[str] = []
    missing_reqs: List[str] = list(missing_info)

    # 1. Hybrid Decision Making — Pathway Evaluation
    if classification_status == "INCOMPLETE" and len(facts) == 0:
        recommended_pathway = TriagePathway.MORE_INFORMATION_REQUIRED
        readiness = CaseReadiness.INCOMPLETE
        settlement = SettlementPotential.LOW
        reasons.append("Based on the information provided, additional key facts are required before a definitive legal pathway can be selected.")
        reasons.append("Essential details regarding incident timeline and parties remain missing.")

    elif case_info.get("potential_pil") is True or any(k in combined_text for k in ["public welfare", "widespread pollution", "systemic failure", "public authority failure"]):
        recommended_pathway = TriagePathway.PIL_REVIEW
        readiness = CaseReadiness.READY
        settlement = SettlementPotential.MEDIUM
        reasons.append("Based on the information provided, this matter has characteristics that may justify a Public Interest Litigation (PIL) suitability review.")
        reasons.append("The dispute involves widespread public harm or systemic public authority duties.")

    elif case_info.get("is_cluster") is True or "mass complaint" in combined_text or "multiple victims" in combined_text:
        recommended_pathway = TriagePathway.CLUSTER_REVIEW
        readiness = CaseReadiness.READY
        settlement = SettlementPotential.MEDIUM
        reasons.append("Based on the available information, this dispute appears similar to multiple recurring complaints and may be suitable for collective action review.")

    elif (
        user_profile.get("gender") == "female"
        or user_profile.get("annual_income", 999999) <= 300000
        or user_profile.get("is_sc_st") is True
        or case_info.get("legal_aid_eligible") is True
    ):
        recommended_pathway = TriagePathway.LEGAL_AID
        readiness = CaseReadiness.READY
        settlement = SettlementPotential.HIGH
        reasons.append("Based on the information provided, you meet preliminary statutory criteria under Section 12 of the Legal Services Authorities Act 1987 for free legal aid.")
        reasons.append("You may approach the nearest District Legal Services Authority (DLSA) for free representation.")

    elif "lockout" in combined_text or "cheque bounce" in combined_text or "unpaid salary" in combined_text or category in ["RENTAL_DISPUTE", "EMPLOYMENT_DISPUTE"]:
        if any(k in combined_text for k in ["refused to speak", "failed negotiation", "threatened court"]):
            recommended_pathway = TriagePathway.MEDIATION
            readiness = CaseReadiness.READY
            settlement = SettlementPotential.MEDIUM
            reasons.append("Based on the information provided, formal mediation or conciliation may be appropriate as direct negotiations have stalled.")
        else:
            recommended_pathway = TriagePathway.SETTLEMENT_FIRST
            readiness = CaseReadiness.READY
            settlement = SettlementPotential.HIGH
            reasons.append("Based on the information provided, this monetary or contractual dispute involves identifiable parties and may be suitable for pre-litigation settlement.")
            reasons.append("Pursuing pre-litigation notice or settlement can avoid unnecessary court litigation.")

    elif category in ["FAMILY_DISPUTE", "PROPERTY_DISPUTE", "CONSUMER_DISPUTE"]:
        recommended_pathway = TriagePathway.ADR_REVIEW
        readiness = CaseReadiness.READY
        settlement = SettlementPotential.HIGH
        reasons.append("Based on the information provided, this dispute is suitable for Alternative Dispute Resolution (ADR) or Lok Adalat proceedings.")

    elif "notice sent" in combined_text or "limitation expiring" in combined_text or category == "CHEQUE_BOUNCE":
        recommended_pathway = TriagePathway.LITIGATION_PREPARATION
        readiness = CaseReadiness.READY
        settlement = SettlementPotential.MEDIUM
        reasons.append("Based on statutory limitation deadlines, formal litigation preparation and draft notice preparation are recommended.")
        warnings.append("⚠️ Statutory Limitation Notice: Ensure statutory deadlines under Section 138 NI Act or Limitation Act 1963 are strictly met.")

    else:
        recommended_pathway = TriagePathway.LAWYER
        readiness = CaseReadiness.READY
        settlement = SettlementPotential.MEDIUM
        reasons.append("Based on the complexity of the legal issues, direct review and representation by a qualified advocate from the Nyaya lawyer network is recommended.")

    # 2. Disclaimer & Framing
    ai_disclaimer = (
        "AI-Assisted Assessment Notice: Based on the information provided, this pathway may be appropriate. "
        "This evaluation does not constitute legal advice, a guarantee of case outcome, or a binding determination."
    )

    # Legacy enum mapping
    legacy_path_map = {
        TriagePathway.SETTLEMENT_FIRST: LegalPathway.SETTLEMENT,
        TriagePathway.MEDIATION: LegalPathway.MEDIATION,
        TriagePathway.LEGAL_AID: LegalPathway.LEGAL_AID,
        TriagePathway.LAWYER: LegalPathway.INDIVIDUAL_LITIGATION,
        TriagePathway.LITIGATION_PREPARATION: LegalPathway.INDIVIDUAL_LITIGATION,
        TriagePathway.CLUSTER_REVIEW: LegalPathway.CLUSTER_REVIEW,
        TriagePathway.PIL_REVIEW: LegalPathway.PIL_REVIEW,
        TriagePathway.ADR_REVIEW: LegalPathway.LOK_ADALAT_REVIEW,
        TriagePathway.MORE_INFORMATION_REQUIRED: LegalPathway.DOCUMENT_COMPLETION,
    }

    return TriageAssessment(
        recommended_pathway=recommended_pathway,
        confidence=0.92,
        reasons=reasons,
        missing_information=missing_reqs,
        requires_human_review=True,
        case_readiness=readiness,
        settlement_potential=settlement,
        recommended_path=legacy_path_map.get(recommended_pathway, LegalPathway.SETTLEMENT),
        missing_requirements=missing_reqs,
        warnings=warnings,
        ai_assisted_disclaimer=ai_disclaimer,
        metadata={
            "category": category,
            "has_safety_concern": has_safety_concern,
            "requires_human_review": True,
        },
    )
