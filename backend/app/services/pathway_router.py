"""
pathway_router.py — Structured Legal Pathway Routing Engine for Nyaya AI.

Determines the optimal dispute resolution pathway for personal legal disputes based on
case intake state, eligibility profiles, cluster/PIL/Lok Adalat indicators, and regulatory bodies.

IMPORTANT:
The router does NOT make a final legal decision. It provides structured preliminary guidance
with `requires_human_review: True`.
"""
import logging
from typing import Dict, Any, Optional, List
from app.models.pathway import LegalPathway, PathwayRecommendation
from app.services.case_type_analyzer import (
    check_cluster_eligibility,
    check_pil_eligibility,
    check_lok_adalat_suitability,
)

logger = logging.getLogger(__name__)

# Specialized regulatory forums by category in Indian law
REGULATORY_CATEGORIES = {
    "CONSUMER_DISPUTE": {
        "forum": "Consumer Disputes Redressal Commission (Consumer Court)",
        "act": "Consumer Protection Act, 2019",
        "reason": "Statutory consumer forum available for product/service deficiencies.",
    },
    "BANKING_FRAUD": {
        "forum": "RBI Banking Ombudsman",
        "act": "Reserve Bank - Integrated Ombudsman Scheme",
        "reason": "Specialized banking ombudsman for unauthorized transactions & service deficiencies.",
    },
    "RERA_BUILDER_DISPUTE": {
        "forum": "Real Estate Regulatory Authority (RERA)",
        "act": "Real Estate (Regulation and Development) Act, 2016",
        "reason": "Dedicated statutory authority for delay in possession, builder defaults & project non-compliance.",
    },
    "INSURANCE_CLAIM": {
        "forum": "Insurance Ombudsman",
        "act": "Insurance Ombudsman Rules, 2017",
        "reason": "Fast-track administrative ombudsman for repudiated or delayed insurance claims.",
    },
    "LABOUR_EMPLOYMENT": {
        "forum": "Labour Commissioner / Industrial Tribunal",
        "act": "Industrial Disputes Act, 1947 / Labour Codes",
        "reason": "Statutory labour authority for illegal termination & wage recovery.",
    },
}


def route_legal_pathway(
    case_info: Dict[str, Any],
    session_state: Optional[Dict[str, Any]] = None,
) -> PathwayRecommendation:
    """
    Evaluates case information and session state to recommend the appropriate legal pathway.
    Uses deterministic rules primarily, returning a structured recommendation.
    """
    if session_state is None:
        session_state = {}

    category = (case_info.get("category") or "").upper()
    issue = (case_info.get("issue") or "").lower()
    facts = " ".join(case_info.get("key_facts", [])).lower()
    combined_text = f"{issue} {facts}"

    classification_status = case_info.get("classification_status", "INCOMPLETE")
    missing_info = case_info.get("missing_information", [])
    has_safety_concern = case_info.get("has_immediate_safety_concern", False)

    # 1. Safety Concern Overrides
    if has_safety_concern:
        return PathwayRecommendation(
            recommended_path=LegalPathway.INDIVIDUAL_LITIGATION,
            confidence=0.95,
            reasons=[
                "Immediate safety or violence concern reported.",
                "Requires immediate law enforcement intervention, emergency protective order, or urgent court petition.",
            ],
            alternative_paths=[LegalPathway.LEGAL_AID],
            requires_human_review=True,
            metadata={"safety_alert": True},
        )

    # 2. Check PIL & Cluster Eligibility
    pil_eval = session_state.get("pil_result") or check_pil_eligibility(case_info)
    cluster_eval = session_state.get("cluster_result") or check_cluster_eligibility(case_info, session_state)

    pil_categories = {"environmental_public", "government_service", "rti", "constitutional", "public_health"}
    is_public_category = (
        category.lower() in pil_categories
        or any(kw in combined_text for kw in ["government", "public interest", "constitution", "pollut", "factory waste", "fundamental right"])
    )

    # Public/Environmental/Government matters -> PIL Review
    if is_public_category and pil_eval.get("is_pil_suitable"):
        reasons = [
            "Dispute affects a wider community or involves systemic public interest elements.",
            "Potential constitutional or fundamental rights dimension identified.",
        ]
        if pil_eval.get("reasons"):
            reasons.append(f"Indicators matched: {', '.join(pil_eval['reasons'])}")

        return PathwayRecommendation(
            recommended_path=LegalPathway.PIL_REVIEW,
            confidence=float(pil_eval.get("confidence", 0.85)),
            reasons=reasons,
            alternative_paths=[LegalPathway.CLUSTER_REVIEW, LegalPathway.INDIVIDUAL_LITIGATION],
            requires_human_review=True,
            metadata={"pil_eval": pil_eval},
        )

    # Shared private counterparty grievances -> Cluster Review
    if cluster_eval.get("is_cluster_candidate"):
        reasons = [
            "Multiple individuals/victims facing a common systemic grievance against the same entity.",
            "Qualifies for collective representation or class-style joint action.",
        ]
        if cluster_eval.get("indicators_found"):
            reasons.append(f"Cluster indicators found: {', '.join(cluster_eval['indicators_found'])}")

        return PathwayRecommendation(
            recommended_path=LegalPathway.CLUSTER_REVIEW,
            confidence=float(cluster_eval.get("confidence", 0.82)),
            reasons=reasons,
            alternative_paths=[LegalPathway.PIL_REVIEW if pil_eval.get("is_pil_suitable") else LegalPathway.INDIVIDUAL_LITIGATION, LegalPathway.MEDIATION],
            requires_human_review=True,
            metadata={"cluster_eval": cluster_eval},
        )

    # Generic PIL suitability
    if pil_eval.get("is_pil_suitable"):
        reasons = [
            "Dispute affects a wider community or involves systemic public interest elements.",
            "Potential constitutional or fundamental rights dimension identified.",
        ]
        if pil_eval.get("reasons"):
            reasons.append(f"Indicators matched: {', '.join(pil_eval['reasons'])}")

        return PathwayRecommendation(
            recommended_path=LegalPathway.PIL_REVIEW,
            confidence=float(pil_eval.get("confidence", 0.85)),
            reasons=reasons,
            alternative_paths=[LegalPathway.CLUSTER_REVIEW, LegalPathway.INDIVIDUAL_LITIGATION],
            requires_human_review=True,
            metadata={"pil_eval": pil_eval},
        )

    # 4. Check Statutory Legal Aid Eligibility
    eligibility_result = session_state.get("eligibility_result")
    eligibility_reasons = session_state.get("eligibility_reasons", [])
    if eligibility_result is True:
        reasons = [
            "Applicant meets income or category criteria for free legal assistance under Section 12 of Legal Services Authorities Act, 1987.",
        ]
        if eligibility_reasons:
            reasons.extend(eligibility_reasons)

        return PathwayRecommendation(
            recommended_path=LegalPathway.LEGAL_AID,
            confidence=0.90,
            reasons=reasons,
            alternative_paths=[LegalPathway.LOK_ADALAT_REVIEW, LegalPathway.MEDIATION],
            requires_human_review=True,
            metadata={"legal_aid": True, "dlsa_info": session_state.get("dlsa_info")},
        )

    # 5. Check Lok Adalat Suitability
    lok_eval = session_state.get("lok_adalat_result") or check_lok_adalat_suitability(case_info)
    if lok_eval.get("is_lok_adalat_suitable") and ("pre_litigation" in combined_text or not session_state.get("in_court")):
        reasons = [
            "Pre-litigation civil, financial, or compoundable dispute with scope for mutual settlement.",
            lok_eval.get("reason", "Suitable for free, fast-track Lok Adalat resolution."),
        ]
        return PathwayRecommendation(
            recommended_path=LegalPathway.LOK_ADALAT_REVIEW,
            confidence=float(lok_eval.get("confidence", 0.80)),
            reasons=reasons,
            alternative_paths=[LegalPathway.SETTLEMENT, LegalPathway.MEDIATION],
            requires_human_review=True,
            metadata={"lok_adalat_eval": lok_eval},
        )

    # 6. Check Regulatory Ombudsman / Dedicated Statutory Body
    for reg_key, reg_info in REGULATORY_CATEGORIES.items():
        if reg_key in category or reg_key.lower() in category.lower() or reg_key.replace("_", " ").lower() in combined_text:
            return PathwayRecommendation(
                recommended_path=LegalPathway.REGULATORY_REFERRAL,
                confidence=0.85,
                reasons=[
                    f"Category matches statutory forum: {reg_info['forum']} under {reg_info['act']}.",
                    reg_info["reason"],
                ],
                alternative_paths=[LegalPathway.MEDIATION, LegalPathway.INDIVIDUAL_LITIGATION],
                requires_human_review=True,
                metadata={"regulatory_forum": reg_info["forum"], "statute": reg_info["act"]},
            )

    # 7. Check Incomplete Case Information (DOCUMENT_COMPLETION)
    if classification_status == "INCOMPLETE" and len(missing_info) >= 2:
        return PathwayRecommendation(
            recommended_path=LegalPathway.DOCUMENT_COMPLETION,
            confidence=0.85,
            reasons=[
                "Essential case facts or documents are still missing.",
                f"Missing fields: {', '.join(missing_info)}.",
                "Gathering necessary documentation is recommended before initiating litigation.",
            ],
            alternative_paths=[LegalPathway.SETTLEMENT, LegalPathway.MEDIATION],
            requires_human_review=True,
            metadata={"missing_information": missing_info},
        )

    # 8. Check Pre-Litigation Settlement / Mediation
    is_pre_litigation = case_info.get("case_stage") in [None, "", "pre_litigation", "notice_stage"]
    if is_pre_litigation and category in ["RENTAL_DISPUTE", "EMPLOYMENT_DISPUTE", "CONTRACT_DISPUTE", "CONSUMER_DISPUTE"]:
        return PathwayRecommendation(
            recommended_path=LegalPathway.MEDIATION,
            confidence=0.80,
            reasons=[
                "Pre-litigation dispute suitable for out-of-court conciliation or legal notice settlement.",
                "Mediation minimizes costs, legal delay, and relationship breakdown.",
            ],
            alternative_paths=[LegalPathway.SETTLEMENT, LegalPathway.INDIVIDUAL_LITIGATION],
            requires_human_review=True,
            metadata={"stage": "pre_litigation"},
        )

    # 9. Default: Individual Litigation
    return PathwayRecommendation(
        recommended_path=LegalPathway.INDIVIDUAL_LITIGATION,
        confidence=0.75,
        reasons=[
            "Standard judicial process required for legal representation and formal remedy.",
            "Consulting an advocate to file or contest court proceedings is recommended.",
        ],
        alternative_paths=[LegalPathway.MEDIATION, LegalPathway.LEGAL_AID],
        requires_human_review=True,
        metadata={"category": category},
    )
