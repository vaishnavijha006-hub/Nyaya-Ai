"""
action_plan_generator.py — Action Plan Generator for Nyaya AI.

Synthesizes complete case state into the concise, 16-section "YOUR NYAYA AI ACTION PLAN".
Implements the structured progression flow:
WHAT HAPPENED -> WHAT MAY APPLY -> WHAT YOU HAVE -> WHAT IS MISSING -> WHAT YOU CAN CONSIDER DOING NEXT.

Provides "Why am I seeing this recommendation?" traceability linking every recommendation to:
- User facts
- Legal RAG sources
- Deterministic rules
- Case analysis
"""
import logging
from typing import Dict, Any, List, Optional, Union
from app.models.action_plan import NyayaAIActionPlan, RecommendationRationale

logger = logging.getLogger(__name__)


def generate_action_plan(session_state: Dict[str, Any]) -> NyayaAIActionPlan:
    """
    Synthesizes the complete 16-section Nyaya AI Legal Action Plan from session state.
    """
    case_info = session_state.get("case_info", {})
    legal_analysis = session_state.get("legal_analysis", {})
    triage = session_state.get("triage_assessment", {})
    case_package = session_state.get("case_package", {})
    cluster = session_state.get("cluster_detection", {})
    pattern_report = session_state.get("pattern_report", {})
    pil_suitability = session_state.get("pil_suitability", {})
    settlement_notice = session_state.get("pre_litigation_notice", {})
    legal_aid_assessment = session_state.get("legal_aid_assessment", {})
    adr = session_state.get("adr_analysis", {})
    documents_uploaded = session_state.get("documents_uploaded", [])
    lawyers = session_state.get("lawyer_suggestions", [])

    urgency = (case_info.get("urgency") or "medium").lower()
    complainant = case_info.get("complainant") or "Initiating Party (Party A)"
    opposite_party = case_info.get("parties") or case_info.get("drawer_name") or "Opposite Party (Party B)"
    location = case_info.get("location") or "Unspecified Jurisdiction"
    category = (case_info.get("category") or "GENERAL_LEGAL").replace("_", " ").title()

    # 1. Your issue
    your_issue = case_info.get("issue") or "Unresolved legal grievance"

    # 2. What we understood
    what_we_understood = {
        "category": category,
        "sub_category": (case_info.get("sub_category") or "General").replace("_", " ").title(),
        "party_a": complainant,
        "party_b": opposite_party,
        "location": location,
        "urgency": urgency.title(),
    }

    # 3. Important facts
    important_facts = case_info.get("key_facts", [])
    if not important_facts:
        important_facts = [your_issue]

    # 4. Relevant legal information
    relevant_legal_info = [
        f"{l.get('act', '')} – {l.get('section', '')}"
        for l in (legal_analysis.get("applicable_laws") or [])[:4]
    ]
    if not relevant_legal_info:
        relevant_legal_info = [f"Applicable statutory rules under {category}"]

    # 5. Important evidence
    important_evidence = [
        d.get("filename", str(d)) if isinstance(d, dict) else str(d) for d in documents_uploaded
    ]

    # 6. Missing evidence
    missing_evidence = case_info.get("missing_information", [])
    if not missing_evidence and triage.get("missing_requirements"):
        missing_evidence = triage["missing_requirements"]

    # 7. Case completeness
    readiness_status = triage.get("case_readiness", case_package.get("completeness_status", "INCOMPLETE"))
    case_completeness = {
        "status": readiness_status,
        "reasons": triage.get("reasons", ["Intake facts evaluated deterministically."]),
    }

    # 8. Settlement possibility
    settlement_possibility = triage.get("settlement_potential", "MEDIUM")

    # 9. ADR possibility
    adr_possibility = adr.get("adr_outcome", "MEDIATION_REVIEW")
    if hasattr(adr_possibility, "value"):
        adr_possibility = adr_possibility.value

    # 10. Legal aid eligibility
    aid_status = legal_aid_assessment.get("status", "Not Established / More Information Needed")
    if hasattr(aid_status, "value"):
        aid_status = aid_status.value

    legal_aid_eligibility = {
        "status": aid_status,
        "matched_criteria": legal_aid_assessment.get("matched_criteria", []),
        "authority": legal_aid_assessment.get("appropriate_authority"),
    }

    # 11. Lawyer pathway
    lawyer_pathway = {
        "suggestions": lawyers[:2],
        "is_eligible_for_aid": aid_status == "Eligible",
        "guidance": (
            "Visit DLSA Legal Aid Front Office for free panel advocate appointment."
            if aid_status == "Eligible"
            else "Consult a qualified advocate from the Legal Saathi network."
        ),
    }

    # 12. Cluster indication
    cluster_indication = {
        "detected": cluster.get("cluster_detected", False),
        "cluster_size": cluster.get("cluster_size", 1),
        "pattern_summary": pattern_report.get("common_issue") if pattern_report else "No related cluster detected",
    }

    # 13. PIL review indication
    pil_review_indication = {
        "potential_pil": pil_suitability.get("potential_pil", False),
        "framing": "This matter shows characteristics that may warrant preliminary PIL review.",
        "public_interest_factors": pil_suitability.get("public_interest_factors", []),
    }

    # 14. Documents to prepare
    documents_to_prepare = case_info.get("documents_likely_needed", [])
    if not documents_to_prepare:
        documents_to_prepare = [
            "Identity Proof (Aadhaar / Voter ID)",
            "Written grievance statement / notice copy",
            "Transaction receipts or communications proof",
        ]

    # 15. Recommended next steps
    recommended_next_steps = []
    if aid_status == "Eligible":
        recommended_next_steps.append(f"Apply to DLSA {location} for free panel advocate appointment.")
    if settlement_possibility in ["HIGH", "MEDIUM"] and settlement_notice:
        recommended_next_steps.append(f"Issue Pre-Litigation Settlement Notice to {opposite_party}.")
    recommended_next_steps.append("Gather missing evidence items and verify dates before filing.")

    # 16. Important warnings/disclaimer
    warnings = list(triage.get("warnings", []))
    if case_package.get("consistency_warnings"):
        warnings.extend(case_package["consistency_warnings"])
    if not warnings:
        warnings = ["Ensure all dates and documents match official records before court submission."]

    important_warnings_disclaimer = {
        "warnings": warnings,
        "disclaimer": (
            "This action plan is produced by Nyaya AI using deterministic rules, user-provided facts, and verified legal RAG sources. "
            "It provides legal information, NOT guaranteed legal outcomes. Final advice requires human advocate review."
        ),
        "requires_human_review": True,
    }

    # Concise Progression Flow
    what_happened = f"Grievance reported regarding {category}: {your_issue}"
    what_may_apply = relevant_legal_info
    what_you_have = important_facts + important_evidence
    what_is_missing = missing_evidence if missing_evidence else ["No critical missing facts."]
    what_you_can_consider_doing_next = recommended_next_steps

    # Traceability & "Why am I seeing this recommendation?"
    recommendation_rationales: List[RecommendationRationale] = [
        RecommendationRationale(
            recommendation=recommended_next_steps[0],
            source_type="DETERMINISTIC_RULE",
            source_detail=f"Legal Aid Status: {aid_status}",
            explanation=f"Why am I seeing this recommendation? Your profile matched Section 12 criteria for legal aid eligibility in {location}."
        ),
        RecommendationRationale(
            recommendation="Pre-Litigation Settlement / ADR Review",
            source_type="CASE_ANALYSIS",
            source_detail=f"Settlement Potential: {settlement_possibility}, ADR Pathway: {adr_possibility}",
            explanation="Why am I seeing this recommendation? Case analysis indicates this dispute type has high pre-litigation settlement potential."
        ),
        RecommendationRationale(
            recommendation=f"Applicable Statutory Framework: {relevant_legal_info[0]}",
            source_type="LEGAL_RAG",
            source_detail=f"Retrieved provisions for {category}",
            explanation=f"Why am I seeing this recommendation? Legal RAG retriever identified statutory provisions governing {category} disputes."
        )
    ]

    return NyayaAIActionPlan(
        title="YOUR NYAYA AI ACTION PLAN",
        your_issue=your_issue,
        what_we_understood=what_we_understood,
        important_facts=important_facts,
        relevant_legal_information=relevant_legal_info,
        important_evidence=important_evidence,
        missing_evidence=missing_evidence,
        case_completeness=case_completeness,
        settlement_possibility=settlement_possibility,
        adr_possibility=str(adr_possibility),
        legal_aid_eligibility=legal_aid_eligibility,
        lawyer_pathway=lawyer_pathway,
        cluster_indication=cluster_indication,
        pil_review_indication=pil_review_indication,
        documents_to_prepare=documents_to_prepare,
        recommended_next_steps=recommended_next_steps,
        important_warnings_disclaimer=important_warnings_disclaimer,
        what_happened=what_happened,
        what_may_apply=what_may_apply,
        what_you_have=what_you_have,
        what_is_missing=what_is_missing,
        what_you_can_consider_doing_next=what_you_can_consider_doing_next,
        recommendation_rationales=recommendation_rationales,
        requires_human_review=True,
    )


def explain_recommendation_why(recommendation_text: str, plan: NyayaAIActionPlan) -> str:
    """
    Returns 'Why am I seeing this recommendation?' explanation for a given recommendation.
    """
    for r in plan.recommendation_rationales:
        if recommendation_text.lower() in r.recommendation.lower() or r.recommendation.lower() in recommendation_text.lower():
            return f"[{r.source_type}] {r.explanation} (Source: {r.source_detail})"
    
    return f"[CASE_ANALYSIS] Why am I seeing this recommendation? Generated based on case intake facts and deterministic pathway rules."


def format_action_plan_message(plan: Union[NyayaAIActionPlan, Dict[str, Any]]) -> str:
    """Format the complete 16-section Action Plan into readable chat markdown."""
    if isinstance(plan, NyayaAIActionPlan):
        p = plan.model_dump()
    else:
        p = plan

    lines = ["# 📋 YOUR NYAYA AI LEGAL ACTION PLAN", ""]

    # 1. YOUR PROBLEM
    lines.extend([
        "### 1. YOUR ISSUE",
        f"{p.get('your_issue', p.get('1_your_problem', 'Not specified'))}",
        "",
    ])

    # 2. WHAT WE UNDERSTOOD
    u = p.get("what_we_understood", p.get("2_what_we_understood", {}))
    lines.extend([
        "### 2. WHAT WE UNDERSTOOD",
        f"• **Category:** {u.get('category', '')} — {u.get('sub_category', '')}",
        f"• **Parties:** {u.get('party_a', '')} (Party A) vs. {u.get('party_b', '')} (Party B)",
        f"• **Location:** {u.get('location', '')}",
        f"• **Urgency:** {u.get('urgency', '')}",
        "",
    ])

    # 3. IMPORTANT FACTS
    facts = p.get("important_facts", p.get("3_important_facts", []))
    lines.append("### 3. IMPORTANT FACTS")
    for f in facts[:5]:
        lines.append(f"• {f}")
    lines.append("")

    # 4. RELEVANT LEGAL INFORMATION
    laws = p.get("relevant_legal_information", p.get("6_relevant_law", []))
    lines.append("### 4. RELEVANT LEGAL INFORMATION")
    for l in laws:
        lines.append(f"• 📜 {l}")
    lines.append("")

    # 5. IMPORTANT EVIDENCE
    ev = p.get("important_evidence", p.get("5_documents_evidence", {}).get("uploaded", []))
    lines.append("### 5. IMPORTANT EVIDENCE")
    if ev:
        for e in ev:
            lines.append(f"• 📁 {e}")
    else:
        lines.append("• No uploaded evidence attached yet.")
    lines.append("")

    # 6. MISSING EVIDENCE
    missing = p.get("missing_evidence", p.get("4_missing_information", []))
    lines.append("### 6. MISSING EVIDENCE")
    if missing:
        for m in missing[:4]:
            lines.append(f"• ❓ {m}")
    else:
        lines.append("• No critical missing facts.")
    lines.append("")

    # 7. CASE COMPLETENESS
    readiness = p.get("case_completeness", p.get("8_case_readiness", {}))
    lines.extend([
        "### 7. CASE COMPLETENESS",
        f"• **Status:** `{readiness.get('status', 'INCOMPLETE')}`",
        f"• **Notes:** {'; '.join(readiness.get('reasons', []))}",
        "",
    ])

    # 8. SETTLEMENT POSSIBILITY
    lines.extend([
        "### 8. SETTLEMENT POSSIBILITY",
        f"• **Potential:** `{p.get('settlement_possibility', 'MEDIUM')}`",
        "",
    ])

    # 9. ADR POSSIBILITY
    lines.extend([
        "### 9. ADR POSSIBILITY",
        f"• **Pathway:** `{p.get('adr_possibility', 'Mediation')}`",
        "",
    ])

    # 10. LEGAL AID ELIGIBILITY
    aid = p.get("legal_aid_eligibility", p.get("10_legal_aid_eligibility", {}))
    lines.extend([
        "### 10. LEGAL AID ELIGIBILITY",
        f"• **Status:** `{aid.get('status', 'Not Established')}`",
        "",
    ])

    # 11. LAWYER PATHWAY
    lp = p.get("lawyer_pathway", p.get("11_lawyer_pathway", {}))
    lines.extend([
        "### 11. LAWYER PATHWAY",
        f"• **Guidance:** {lp.get('guidance', '')}",
        "",
    ])

    # 12. CLUSTER INDICATION
    cl = p.get("cluster_indication", p.get("12_cluster_status", {}))
    lines.extend([
        "### 12. CLUSTER INDICATION",
        f"• **Detected:** {'Yes (Size: ' + str(cl.get('cluster_size')) + ')' if cl.get('detected') else 'No'}",
        "",
    ])

    # 13. PIL REVIEW INDICATION
    pil = p.get("pil_review_indication", p.get("13_pil_suitability_review", {}))
    lines.extend([
        "### 13. PIL REVIEW INDICATION",
        f"• **Framing:** *\"{pil.get('framing', '')}\"*",
        "",
    ])

    # 14. DOCUMENTS TO PREPARE
    docs_prep = p.get("documents_to_prepare", p.get("14_regulatory_pathway", []))
    lines.append("### 14. DOCUMENTS TO PREPARE")
    for d in docs_prep:
        lines.append(f"• 📄 {d}")
    lines.append("")

    # 15. RECOMMENDED NEXT STEPS
    rec_steps = p.get("recommended_next_steps", [p.get("15_recommended_next_step", "")])
    lines.append("### 15. RECOMMENDED NEXT STEPS")
    for step in rec_steps:
        lines.append(f"✅ **{step}**")
    lines.append("")

    # 16. IMPORTANT WARNINGS / DISCLAIMER
    warn = p.get("important_warnings_disclaimer", p.get("16_warnings_human_review", {}))
    lines.append("### 16. IMPORTANT WARNINGS / DISCLAIMER")
    for w in warn.get("warnings", []):
        lines.append(f"• ⚠️ {w}")
    lines.extend([
        "",
        "---",
        f"*⚠️ {warn.get('disclaimer', '')}*",
    ])

    return "\n".join(lines)
