"""
systemic_action_engine.py — Systemic Action Engine for Nyaya AI.

Converts repeated individual complaints and vector clusters into structured Pattern Reports
for 6 systemic pathways: Representative Action, Consolidation, PIL Review, Regulatory Referral,
Legal Services Authority Referral, and Policy Intervention.
"""
import hashlib
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.models.pathway import LegalPathway
from app.models.cluster import ClusterDetectionResult
from app.models.pattern_report import (
    PatternReport,
    ClusterDashboardData,
    SystemicPathway,
)

logger = logging.getLogger(__name__)


def generate_pattern_report(
    cluster_result: Dict[str, Any],
    case_info: Optional[Dict[str, Any]] = None,
) -> Optional[PatternReport]:
    """
    Generates a structured Pattern Report for systemic legal review.
    Enforces non-decision framing for PIL and consolidation pathways.
    """
    if case_info is None:
        case_info = {}

    if isinstance(cluster_result, ClusterDetectionResult):
        cluster_data = cluster_result.model_dump()
    elif isinstance(cluster_result, dict):
        cluster_data = cluster_result
    else:
        return None

    cluster_detected = cluster_data.get("cluster_detected", False)
    similarity_score = float(cluster_data.get("similarity_score", 0.0))
    cluster_size = int(cluster_data.get("cluster_size", cluster_data.get("number_of_cases", 1)))

    if not cluster_detected or cluster_size < 2 or similarity_score < 0.60:
        return None

    from app.services.cluster_engine import anonymize_case_data
    anon_info = anonymize_case_data(case_info) if case_info else {}

    category = (anon_info.get("category") or case_info.get("category") or cluster_data.get("metadata", {}).get("category") or "GENERAL_LEGAL").upper()
    issue = anon_info.get("scrubbed_issue") or case_info.get("issue") or (cluster_data.get("common_issues") or ["Systemic legal dispute"])[0]
    location = case_info.get("location") or cluster_data.get("metadata", {}).get("location") or "Regional District"

    cluster_id = cluster_data.get("cluster_id") or f"cluster_{category.lower()}_{hashlib.md5(issue.encode()).hexdigest()[:8]}"
    report_id = f"report_{cluster_id}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

    # 1. Cluster size & 2. Common issue
    common_issue = (
        f"Repeated grievances ({cluster_size} cases) regarding {category.replace('_', ' ').title()}: {issue[:120]}"
    )

    # 3. Common facts
    common_facts = list(cluster_data.get("common_facts", []))
    if anon_info.get("scrubbed_facts"):
        for f in anon_info["scrubbed_facts"][:2]:
            if f not in common_facts:
                common_facts.append(f)
    if not common_facts:
        common_facts = [
            f"Multiple affected parties facing similar conduct by {category.replace('_', ' ').title()} counterparty.",
            f"Recurring pattern reported within {location}.",
        ]

    # 4. Common evidence
    common_evidence = [
        "Payment receipts & bank transaction proof",
        "Written notices & digital message transcripts",
        "Contractual agreements / Lease deeds / Terms of service",
    ]

    # 5. Time pattern & 6. Geographic distribution
    time_pattern = "Cluster pattern observed over recent 30-90 day window"
    geo_dist = f"{location} and surrounding municipal district jurisdiction"

    # 7. Potential affected population & 8. Systemic indicators
    population_est = f"Estimated {cluster_size * 10 - 25} to {cluster_size * 50} similarly situated individuals in district."
    systemic_indicators = [
        f"Repeated similar complaints ({cluster_size} logged)",
        f"Widespread non-compliance with statutory obligations under {category.replace('_', ' ').title()} rules",
        "Potential failure of administrative dispute escalation mechanisms",
    ]

    # 9. Recommended review pathways (6 systemic pathways)
    systemic_pathways: List[SystemicPathway] = [
        SystemicPathway.REPRESENTATIVE_ACTION,
        SystemicPathway.CONSOLIDATION_POSSIBILITY,
        SystemicPathway.REGULATORY_REFERRAL,
        SystemicPathway.LEGAL_SERVICES_AUTHORITY_REFERRAL,
    ]

    if category in ["ENVIRONMENTAL_PUBLIC", "GOVERNMENT_SERVICE", "PUBLIC_HEALTH"] or cluster_size >= 5:
        systemic_pathways.append(SystemicPathway.PIL_REVIEW)
        systemic_pathways.append(SystemicPathway.POLICY_INTERVENTION)

    legacy_pathways: List[LegalPathway] = [
        LegalPathway.CLUSTER_REVIEW,
        LegalPathway.PIL_REVIEW,
        LegalPathway.REGULATORY_REFERRAL,
        LegalPathway.LEGAL_AID,
    ]

    pathway_recs = [
        "Representative Action: Consider joint representation for affected claimants.",
        "Consolidation Review: Evaluate potential consolidation of proceedings under applicable civil procedure.",
        "Regulatory Referral: Submit aggregated pattern report to statutory ombudsman or regulator.",
        "DLSA Referral: Connect eligible claimants with District Legal Services Authority.",
        "PIL Review: Preliminary review for public interest litigation viability.",
        "Policy Intervention: Submit evidence-based policy brief to administrative authorities.",
    ]

    # Non-Decision Wording Directives
    pil_note = "This pattern may have characteristics that warrant preliminary PIL/public-interest review."
    consolidation_note = "Potential consolidation/representative-action pathway may be considered subject to applicable law and legal review."

    return PatternReport(
        report_id=report_id,
        cluster_id=cluster_id,
        cluster_size=cluster_size,
        number_of_related_complaints=cluster_size,
        common_issue=common_issue,
        common_facts=common_facts,
        common_factual_pattern=common_facts,
        common_evidence=common_evidence,
        time_pattern=time_pattern,
        timeline_pattern=time_pattern,
        geographic_distribution=geo_dist,
        geographic_pattern=geo_dist,
        potential_affected_population=population_est,
        potential_systemic_indicators=systemic_indicators,
        recommended_review_pathway=systemic_pathways,
        possible_legal_pathways=legacy_pathways,
        pathway_recommendations=pathway_recs,
        similarity_confidence=round(float(cluster_data.get("confidence", similarity_score)), 2),
        potential_impact="SYSTEMIC_PUBLIC" if cluster_size >= 5 else "REGIONAL",
        pil_suitability_note=pil_note,
        consolidation_note=consolidation_note,
        requires_human_review=True,
        metadata={
            "category": category,
            "location": location,
            "similarity_score": similarity_score,
            "requires_human_review": True,
        },
    )


def generate_cluster_dashboard(cluster_results: List[Dict[str, Any]]) -> ClusterDashboardData:
    """Synthesizes multiple cluster detection results into a Cluster Dashboard."""
    reports: List[PatternReport] = []
    high_conf_count = 0

    for c in cluster_results:
        rep = generate_pattern_report(c)
        if rep:
            reports.append(rep)
            if rep.similarity_confidence >= 0.80:
                high_conf_count += 1

    return ClusterDashboardData(
        total_active_clusters=len(reports),
        high_confidence_clusters=high_conf_count,
        pattern_reports=reports,
        last_updated=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
    )
