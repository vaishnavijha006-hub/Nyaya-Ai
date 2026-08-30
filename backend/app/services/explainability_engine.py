"""
explainability_engine.py — AI Explainability Engine for Nyaya AI.

Provides concise explainability objects across all AI recommendations (Triage, Legal Aid, ADR, PIL, Action Plan).
Exposes 7 core components:
1. Recommendation
2. Factors considered
3. Evidence considered
4. Legal sources used
5. Missing information
6. Confidence/uncertainty
7. Human review requirement

STRICT GUARDRAIL: Does NOT expose hidden chain-of-thought (CoT). Exposes only concise decision factors and evidence.
"""
import logging
from typing import Dict, Any, Optional, List
from app.models.explainability import RecommendationExplainability

logger = logging.getLogger(__name__)


def generate_explainability(
    recommendation_text: str,
    case_info: Dict[str, Any],
    session_state: Optional[Dict[str, Any]] = None,
    factors: Optional[List[str]] = None,
    sources: Optional[List[str]] = None,
    uncertainty_note: Optional[str] = None,
) -> RecommendationExplainability:
    """
    Constructs a RecommendationExplainability object exposing all 7 required components.
    Ensures internal chain-of-thought reasoning is completely omitted.
    """
    if session_state is None:
        session_state = {}

    category = (case_info.get("category") or "GENERAL_LEGAL").replace("_", " ").title()
    issue = case_info.get("issue") or ""
    key_facts = case_info.get("key_facts", [])

    # 1. Recommendation
    rec = recommendation_text

    # 2. Factors considered
    factors_considered = list(factors) if factors else []
    if not factors_considered:
        if "monetary" in issue.lower() or "cheque" in issue.lower() or "deposit" in issue.lower() or "rent" in issue.lower():
            factors_considered.append("Monetary dispute suitable for settlement")
        if case_info.get("complainant") and case_info.get("parties"):
            factors_considered.append("Both parties identifiable")
        if (case_info.get("urgency") or "").lower() not in ["high", "critical", "emergency"]:
            factors_considered.append("No emergency detected")
        if "landlord" in issue.lower() or "tenant" in issue.lower() or "contract" in issue.lower():
            factors_considered.append("Ongoing relationship / contractual framework")
        factors_considered.append(f"Grievance Category: {category}")

    # 3. Evidence considered
    documents_uploaded = session_state.get("documents_uploaded", [])
    evidence_considered = [
        d.get("filename", str(d)) if isinstance(d, dict) else str(d) for d in documents_uploaded
    ]
    if not evidence_considered:
        evidence_considered = [f"User intake statement for {category}"]

    # 4. Legal sources used
    legal_analysis = session_state.get("legal_analysis", {})
    legal_sources_used = list(sources) if sources else []
    if not legal_sources_used:
        for l in (legal_analysis.get("applicable_laws") or [])[:3]:
            legal_sources_used.append(f"{l.get('act', '')} - {l.get('section', '')}")
    if not legal_sources_used:
        legal_sources_used = [f"Statutory provisions governing {category}"]

    # 5. Missing information
    missing_information = case_info.get("missing_information", [])
    if not missing_information and session_state.get("triage_assessment", {}).get("missing_requirements"):
        missing_information = session_state["triage_assessment"]["missing_requirements"]

    # 6. Confidence / Uncertainty
    conf_value = float(session_state.get("triage_assessment", {}).get("confidence", 0.85))
    unc_text = uncertainty_note or "Settlement or legal outcome cannot be guaranteed and depends on mutual consent / court determination."
    confidence_uncertainty = {
        "confidence": round(conf_value, 2),
        "uncertainty": unc_text,
    }

    # 7. Human review requirement
    human_review_requirement = {
        "requires_human_review": True,
        "note": "Recommended.",
    }

    return RecommendationExplainability(
        recommendation=rec,
        factors_considered=factors_considered,
        evidence_considered=evidence_considered,
        legal_sources_used=legal_sources_used,
        missing_information=missing_information,
        confidence_uncertainty=confidence_uncertainty,
        human_review_requirement=human_review_requirement,
        metadata={"category": category},
    )
