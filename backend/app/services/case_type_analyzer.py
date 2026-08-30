"""
case_type_analyzer.py — Cluster case filing, PIL, and Lok Adalat detection.
Reuses existing ClusterDetectionEngine from cluster_detection.py.
"""
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# ── LOK ADALAT eligible dispute types ─────────────────────────────────────────
LOK_ADALAT_ELIGIBLE_CATEGORIES = {
    "debt_financial": "Compoundable debt and financial disputes are often suitable for Lok Adalat.",
    "consumer_complaint": "Consumer disputes are commonly settled through Lok Adalat.",
    "accident_compensation": "Motor accident compensation claims are frequently resolved through Lok Adalat.",
    "tenant_landlord": "Certain pre-litigation tenancy disputes can be settled through Lok Adalat.",
    "employment_dispute": "Labour disputes where both parties agree to settle are eligible.",
    "contract_dispute": "Commercial contract disputes with settlement possibility are eligible.",
    "government_service": "Certain government service disputes can be taken to Lok Adalat.",
}

# ── PIL eligibility indicators ─────────────────────────────────────────────────
PIL_INDICATOR_KEYWORDS = [
    "multiple people", "community", "public health", "environment", "pollution",
    "government policy", "fundamental rights", "systemic", "large scale", "everyone",
    "public interest", "all residents", "building", "neighbourhood", "slum",
    "water supply", "electricity", "road", "encroachment", "government scheme",
    "corruption", "many tenants", "all workers", "factory",
]

PIL_ELIGIBLE_CATEGORIES = {
    "environmental_public", "government_service", "rti", "harassment", "criminal_complaint"
}


def check_cluster_eligibility(case_info: dict, session_state: dict = None) -> Dict[str, Any]:
    """
    Determine if this case may be part of a cluster/collective case.
    Uses semantic analysis of case facts + category.
    Real Qdrant-based cluster detection is triggered separately by the chat pipeline.
    """
    cluster_indicators = [
        "other tenants", "multiple people", "same landlord", "same employer",
        "same company", "same product", "same builder", "all residents",
        "many others", "others also", "similar problem", "not just me",
        "multiple victims", "group", "community", "neighbourhood",
    ]

    facts = " ".join(case_info.get("key_facts", [])).lower()
    issue = (case_info.get("issue") or "").lower()
    combined_text = facts + " " + issue

    indicator_matches = [ind for ind in cluster_indicators if ind in combined_text]
    is_candidate = len(indicator_matches) > 0

    if is_candidate:
        return {
            "is_cluster_candidate": True,
            "confidence": min(0.5 + len(indicator_matches) * 0.1, 0.9),
            "indicators_found": indicator_matches,
            "message": (
                "Your case description suggests that others may be facing the same issue. "
                "This could qualify for Cluster Case Filing — a collective legal action where "
                "multiple affected parties file together, which can be more impactful and cost-effective."
            ),
            "next_step": "Would you like to explore whether others have reported a similar case?",
            "note": "Cluster case detection is based on your description. Your consent is required before any collective action is initiated.",
        }
    else:
        return {
            "is_cluster_candidate": False,
            "confidence": 0.1,
            "indicators_found": [],
            "message": "This case does not show obvious signs of a collective/cluster issue based on the information provided.",
        }


def check_pil_eligibility(case_info: dict) -> Dict[str, Any]:
    """Determine if the case may have PIL potential."""
    category = (case_info.get("category") or "").lower()
    facts = " ".join(case_info.get("key_facts", [])).lower()
    issue = (case_info.get("issue") or "").lower()
    combined = facts + " " + issue

    keyword_matches = [kw for kw in PIL_INDICATOR_KEYWORDS if kw in combined]
    category_match = category in PIL_ELIGIBLE_CATEGORIES

    is_pil_candidate = len(keyword_matches) >= 2 or (category_match and len(keyword_matches) >= 1)

    if is_pil_candidate:
        return {
            "is_pil_suitable": True,
            "confidence": min(0.4 + len(keyword_matches) * 0.08, 0.85),
            "reasons": keyword_matches[:5],
            "message": (
                "Your case may have a broader public-interest dimension. Issues affecting a large number "
                "of people, fundamental rights violations, or systemic government failures may be suitable "
                "for a Public Interest Litigation (PIL)."
            ),
            "important_note": (
                "This is a preliminary flag based on your description. Whether a PIL is legally maintainable "
                "must be assessed by a qualified advocate. Nyaya AI does NOT declare PIL maintainability."
            ),
            "next_step": "Consult a constitutional or public interest lawyer to assess PIL viability.",
        }
    else:
        return {
            "is_pil_suitable": False,
            "confidence": 0.1,
            "reasons": [],
            "message": "Based on the information provided, this case does not appear to have significant PIL indicators at this stage.",
        }


def check_lok_adalat_suitability(case_info: dict) -> Dict[str, Any]:
    """Determine if the dispute is suitable for Lok Adalat."""
    category = (case_info.get("category") or "").lower()
    case_stage = (case_info.get("case_stage") or "").lower()
    urgency = (case_info.get("urgency") or "").lower()

    # Lok Adalat works best for pre-litigation and settlement-oriented disputes
    is_pre_litigation = case_stage in ["pre_litigation", "pre-litigation", "", None]
    is_suitable_category = category in LOK_ADALAT_ELIGIBLE_CATEGORIES

    # High urgency criminal cases are generally not for Lok Adalat
    is_serious_criminal = category == "criminal_complaint" and urgency == "high"

    if is_suitable_category and not is_serious_criminal:
        reason = LOK_ADALAT_ELIGIBLE_CATEGORIES.get(category, "May be suitable for settlement.")
        return {
            "is_lok_adalat_suitable": True,
            "confidence": 0.75 if is_pre_litigation else 0.5,
            "reason": reason,
            "message": (
                f"This dispute appears potentially suitable for Lok Adalat. {reason} "
                f"Lok Adalat offers free, faster resolution and the award is final and binding."
            ),
            "benefits": [
                "No court fees",
                "Faster resolution",
                "Award is final and cannot be appealed",
                "Mutually agreed settlement",
            ],
            "how_to_access": "Contact your nearest DLSA or TALSA (Taluk Legal Services Authority) to apply for Lok Adalat.",
            "note": "Lok Adalat requires consent of both parties. Admissibility must be confirmed by the relevant authority.",
        }
    else:
        return {
            "is_lok_adalat_suitable": False,
            "confidence": 0.2,
            "message": "Based on the case type and stage, Lok Adalat may not be the most appropriate forum for this dispute.",
            "note": "You can still consult your nearest DLSA to explore all available options.",
        }


def format_case_analysis_message(cluster: Dict, pil: Dict, lok_adalat: Dict) -> str:
    """Format the case type analysis as a readable chat message."""
    lines = ["## Case Type Analysis\n"]

    # Cluster
    lines.append("### 🔗 Cluster Case / Collective Action")
    if cluster.get("is_cluster_candidate"):
        lines.append(f"**Potential detected** (confidence: {int(cluster.get('confidence', 0) * 100)}%)")
        lines.append(cluster.get("message", ""))
        if cluster.get("next_step"):
            lines.append(f"*{cluster['next_step']}*")
    else:
        lines.append("Not indicated based on current information.")
    lines.append("")

    # PIL
    lines.append("### ⚖️ Public Interest Litigation (PIL)")
    if pil.get("is_pil_suitable"):
        lines.append(f"**Potentially relevant** (confidence: {int(pil.get('confidence', 0) * 100)}%)")
        lines.append(pil.get("message", ""))
        lines.append(f"*⚠️ {pil.get('important_note', '')}*")
    else:
        lines.append("Not indicated based on current information.")
    lines.append("")

    # Lok Adalat
    lines.append("### 🏛️ Lok Adalat / ADR")
    if lok_adalat.get("is_lok_adalat_suitable"):
        lines.append(f"**Potentially suitable** (confidence: {int(lok_adalat.get('confidence', 0) * 100)}%)")
        lines.append(lok_adalat.get("message", ""))
        benefits = lok_adalat.get("benefits", [])
        if benefits:
            lines.append("**Benefits:** " + " • ".join(benefits))
        if lok_adalat.get("how_to_access"):
            lines.append(f"**How to access:** {lok_adalat['how_to_access']}")
    else:
        lines.append("Not indicated for this case type.")
    lines.append("")
    lines.append("*These assessments are preliminary and require professional legal review for confirmation.*")

    return "\n".join(lines)
