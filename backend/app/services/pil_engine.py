"""
pil_engine.py — Preliminary PIL Suitability Engine for Nyaya AI.

Analyzes 8 core factors to evaluate preliminary PIL suitability:
1. Number of affected people
2. Public interest
3. Systemic nature
4. Vulnerable groups
5. Government / public authority involvement
6. Repeated similar complaints
7. Availability of alternative remedies
8. Individual / private dispute characteristics

Enforces strict framing: "This matter shows characteristics that may warrant preliminary PIL review."
Generates a structured PIL Review Brief.
"""
import logging
from typing import Dict, Any, Optional, List, Tuple
from app.models.pathway import LegalPathway
from app.models.pil_analysis import (
    PILSuitabilityResult,
    PILSuitabilityOutcome,
    PILReviewBrief,
)

logger = logging.getLogger(__name__)


def evaluate_pil_suitability(
    case_info: Dict[str, Any],
    session_state: Optional[Dict[str, Any]] = None,
) -> Tuple[PILSuitabilityResult, Optional[PILReviewBrief]]:
    """
    Evaluates preliminary PIL suitability across 8 factors and generates a PIL Review Brief.
    """
    if session_state is None:
        session_state = {}

    category = (case_info.get("category") or "").upper()
    issue = case_info.get("issue") or ""
    facts = " ".join(case_info.get("key_facts", [])).lower()
    combined_text = f"{issue} {facts}".lower()
    location = case_info.get("location", "Local Region")
    classification_status = case_info.get("classification_status", "COMPLETE")
    cluster_size = case_info.get("cluster_size", 1)

    reasons: List[str] = []
    counter_indicators: List[str] = []
    supporting_pattern_data: List[str] = []
    public_interest_factors: List[str] = []

    # Check 1: Insufficient Information
    if classification_status == "INCOMPLETE" and len(issue) < 5:
        result = PILSuitabilityResult(
            potential_suitability=PILSuitabilityOutcome.INSUFFICIENT_INFORMATION,
            reasons=["Essential facts and grievance scope remain incomplete."],
            counter_indicators=["Insufficient data to determine public interest scope."],
            supporting_pattern_data=[],
            requires_legal_review=True,
            potential_pil=False,
            confidence=0.10,
            assessment_framing="Insufficient information available to evaluate PIL suitability.",
        )
        return result, None

    # 8 Factor Analysis
    # Factor 1: Number of affected people
    if any(k in combined_text for k in ["entire village", "all residents", "hundreds", "thousands", "everyone", "community", "all workers"]):
        reasons.append("Affected Population: Dispute impacts a broad community or large segment of the public.")
        public_interest_factors.append("Broad Affected Population")

    # Factor 2: Public interest
    if any(k in combined_text for k in ["pollution", "drinking water", "environment", "public safety", "health hazard", "toxic waste"]):
        reasons.append("Public Interest: Involves fundamental public health, environmental safety, or constitutional welfare.")
        public_interest_factors.append("Public Welfare & Safety")

    # Factor 3: Systemic nature
    if any(k in combined_text for k in ["systemic", "widespread", "institutional failure", "policy violation"]):
        reasons.append("Systemic Nature: Reflects an ongoing structural or administrative failure rather than a single isolated incident.")
        public_interest_factors.append("Systemic Administrative Pattern")

    # Factor 4: Vulnerable groups
    if any(k in combined_text for k in ["children", "women", "senior citizens", "slum", "labourers", "poverty", "disabled", "tribal"]):
        reasons.append("Vulnerable Groups: Involves marginalized or socio-economically disadvantaged populations.")
        public_interest_factors.append("Vulnerable Population Protection")

    # Factor 5: Government / Public Authority involvement
    if any(k in combined_text for k in ["government", "municipal corporation", "police", "water board", "electricity board", "panchayat", "public authority"]):
        reasons.append("Public Authority Involvement: Action or omission by a statutory authority or government body.")
        public_interest_factors.append("Public Authority Duty")

    # Factor 6: Repeated similar complaints
    if cluster_size >= 3 or "multiple complaints" in combined_text or case_info.get("is_cluster") is True:
        reasons.append(f"Repeated Complaints: Cross-case clustering identified {cluster_size} similar complaints.")
        supporting_pattern_data.append(f"Cluster data confirms {cluster_size} semantically related complaints in district.")

    # Factor 7: Availability of alternative remedies
    if "consumer court" in combined_text or "labour court" in combined_text or "rera" in combined_text:
        counter_indicators.append("Alternative Statutory Forum Available: Dedicated administrative or consumer tribunal exists.")

    # Factor 8: Individual / Private dispute characteristics
    if any(k in combined_text for k in ["lockout", "cheque", "personal debt", "security deposit"]) and not any(k in combined_text for k in ["all tenants", "mass lockout", "entire building"]):
        counter_indicators.append("Private Dispute Characteristics: Matter appears primarily private/contractual between private parties.")

    # Outcome Determination
    if len(public_interest_factors) >= 3 or (cluster_size >= 5 and len(public_interest_factors) >= 2):
        suitability = PILSuitabilityOutcome.HIGHER_INDICATION
        confidence = 0.88
    elif len(public_interest_factors) >= 1 or cluster_size >= 3:
        suitability = PILSuitabilityOutcome.MODERATE_INDICATION
        confidence = 0.65
    else:
        suitability = PILSuitabilityOutcome.LOW_INDICATION
        confidence = 0.35

    assessment_framing = "This matter shows characteristics that may warrant preliminary PIL review."

    result = PILSuitabilityResult(
        potential_suitability=suitability,
        reasons=reasons if reasons else ["Dispute characteristics are primarily individual in scope."],
        counter_indicators=counter_indicators,
        supporting_pattern_data=supporting_pattern_data,
        requires_legal_review=True,
        potential_pil=suitability in [PILSuitabilityOutcome.HIGHER_INDICATION, PILSuitabilityOutcome.MODERATE_INDICATION],
        confidence=confidence,
        public_interest_factors=public_interest_factors,
        why_flagged=reasons,
        alternative_paths=[
            LegalPathway.CLUSTER_REVIEW,
            LegalPathway.REGULATORY_REFERRAL,
            LegalPathway.LEGAL_AID,
            LegalPathway.INDIVIDUAL_LITIGATION,
        ],
        assessment_framing=assessment_framing,
        metadata={"category": category, "location": location},
    )

    # Generate PIL Review Brief
    legal_analysis = session_state.get("legal_analysis", {})
    laws = legal_analysis.get("applicable_laws") or [
        {"act": "Constitution of India", "section": "Article 21 (Right to Life & Healthy Environment)"},
        {"act": "Constitution of India", "section": "Article 226 / Article 32 (Writ Jurisdiction)"},
    ]

    docs_uploaded = session_state.get("documents_uploaded", [])
    supporting_evidence = [
        d.get("filename", "") if isinstance(d, dict) else str(d) for d in docs_uploaded
    ]
    if not supporting_evidence:
        supporting_evidence = ["Grievance Statement", "Photographic / Media proof (Pending upload)"]

    existing_remedies = [
        "Statutory representation to Municipal / Executive Authorities",
        "Complaint to specialized Statutory Ombudsman or Regulatory Commission",
        "Writ Petition under Article 226 (High Court) if statutory remedies are ineffective",
    ]

    questions_for_lawyer = [
        "Does the petitioner/organization satisfy locus standi and bona fide public interest credentials required by court rules?",
        "Have statutory administrative remedies been adequately pursued or exhausted prior to invoking writ jurisdiction?",
        "What specific public authority/department should be named as Primary Respondent?",
        "Is interim emergency relief required to prevent irreparable public harm?",
    ]

    affected_pop = f"Residents / Affected public of {location}"

    brief = PILReviewBrief(
        brief_title="PIL Review Brief (Preliminary Analysis)",
        problem=issue or f"Public grievance in {category.replace('_', ' ').title()}",
        issue=issue or f"Public grievance in {category.replace('_', ' ').title()}",
        affected_population=affected_pop,
        pattern_evidence=supporting_pattern_data if supporting_pattern_data else ["Individual complaint logged"],
        systemic_pattern=reasons,
        public_interest_indicators=public_interest_factors,
        existing_remedies=existing_remedies,
        questions_requiring_lawyer_review=questions_for_lawyer,
        unanswered_questions=questions_for_lawyer,
        supporting_evidence=supporting_evidence,
        relevant_legal_provisions=laws,
        potential_public_interest_concern=f"Public interest concern in {location} regarding: {', '.join(public_interest_factors[:3])}.",
        recommended_human_review="Consult a constitutional legal advocate for professional PIL maintainability evaluation under Article 226 / Article 32.",
        ai_disclaimer="This brief is an AI-assisted analytical synthesis for advocate review. Nyaya AI does NOT file PILs or declare legal maintainability.",
        metadata={"category": category, "confidence": confidence},
    )

    return result, brief
