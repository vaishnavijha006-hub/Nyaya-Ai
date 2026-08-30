"""
case_packaging.py — Judge-Ready Case Packaging Engine for Nyaya AI.

Synthesizes case intake facts, issue-evidence matrix, document annexures, chronology,
limitation warnings, and draft pleading into a structured 13-part case package.
"""
import logging
from typing import Dict, Any, Optional, List
from app.models.case_package import (
    IssueEvidenceItem,
    ChronologyItem,
    AnnexureItem,
    StructuredCasePackage,
)

logger = logging.getLogger(__name__)


def generate_structured_case_package(
    session_state: Dict[str, Any]
) -> StructuredCasePackage:
    """
    Generates a 13-part Judge-Ready Case Package with complete evidence mapping
    and preliminary completeness checking.
    """
    case_info = session_state.get("case_info", {})
    legal_analysis = session_state.get("legal_analysis", {})
    docs_uploaded = session_state.get("documents_uploaded", [])
    missing_info = case_info.get("missing_information", [])

    category = (case_info.get("category") or "GENERAL_LEGAL").replace("_", " ").title()
    sub_category = (case_info.get("sub_category") or "").replace("_", " ").title()
    issue_desc = case_info.get("issue") or "Unspecified legal dispute"

    # 1. Case Summary
    summary = {
        "category": category,
        "sub_category": sub_category or "General",
        "primary_issue": issue_desc,
        "location": case_info.get("location", "Not specified"),
        "urgency": (case_info.get("urgency") or "Medium").title(),
        "case_stage": (case_info.get("case_stage") or "Pre-litigation").title(),
    }

    # 2. Parties
    parties = {
        "complainant_applicant": case_info.get("complainant", "User / Aggrieved Party"),
        "opposite_party": case_info.get("parties", "Opposite Party / Respondent"),
        "respondent_details": case_info.get("vendor_name") or case_info.get("employer_name") or case_info.get("drawer_name") or "Not specified",
    }

    # 3. Chronology
    chronology: List[ChronologyItem] = []
    date_fields = [
        ("lockout_date", "Lockout / Incident occurred"),
        ("incident_date", "Incident date"),
        ("cheque_date", "Cheque issued date"),
        ("return_memo_date", "Bank dishonour memo received"),
        ("legal_notice_date", "Statutory legal notice sent"),
    ]

    for field_key, label in date_fields:
        val = case_info.get(field_key)
        if val:
            chronology.append(ChronologyItem(date_time=str(val), event_description=label))

    if not chronology and case_info.get("key_facts"):
        for idx, fact in enumerate(case_info.get("key_facts", [])):
            chronology.append(ChronologyItem(date_time=f"Event #{idx+1}", event_description=fact))

    if not chronology:
        chronology.append(ChronologyItem(date_time="Date Unspecified", event_description="Incident reported by user"))

    # 4. Issues & 5. Claims
    issues = [issue_desc]
    if sub_category:
        issues.append(f"Sub-issue: {sub_category}")

    claims = list(case_info.get("claims", []))
    if not claims:
        claims = [f"Claim for remedy arising from: {issue_desc}"]

    facts = list(case_info.get("key_facts", []))
    if not facts:
        facts = [issue_desc]

    # 6. Relief Requested
    relief = case_info.get("desired_outcome") or case_info.get("relief_requested") or "Restoration of rights, financial recovery, or dispute resolution."

    # 7. Evidence List & 9. Annexure List
    evidence_list: List[str] = []
    annexure_list: List[AnnexureItem] = []

    for idx, doc in enumerate(docs_uploaded, 1):
        fname = doc.get("filename") if isinstance(doc, dict) else str(doc)
        annex_num = f"Annexure A-{idx}"
        evidence_list.append(f"{annex_num}: {fname}")
        annexure_list.append(AnnexureItem(annexure_number=annex_num, document_name=fname, status="UPLOADED"))

    if not annexure_list:
        annexure_list.append(AnnexureItem(annexure_number="Annexure A-1 (Pending)", document_name="Primary Evidence Document", status="MISSING"))
        evidence_list.append("Primary Evidence Document (Pending Upload)")

    # 8. Issue-Evidence Matrix
    issue_matrix: List[IssueEvidenceItem] = []
    uploaded_names = [d.get("filename", "") if isinstance(d, dict) else str(d) for d in docs_uploaded]
    matrix_status = "VERIFIED" if session_state.get("documents_verified") else ("CLAIMED" if docs_uploaded else "MISSING")

    issue_matrix.append(
        IssueEvidenceItem(
            issue=issue_desc,
            supporting_facts=facts,
            supporting_documents=uploaded_names if uploaded_names else ["Pending Upload"],
            evidence_status=matrix_status,
        )
    )

    # 10. Missing Documents
    missing_docs: List[str] = []
    docs_needed = case_info.get("evidence_available", []) + case_info.get("documents_likely_needed", [])
    for doc in docs_needed:
        if doc not in uploaded_names:
            missing_docs.append(doc)

    if not docs_uploaded:
        missing_docs.append("Primary documentary proof (Agreements, Receipts, Notices)")

    # 11. Potential Inconsistencies
    inconsistencies: List[str] = []
    cheque_date = case_info.get("cheque_date")
    memo_date = case_info.get("return_memo_date")
    if cheque_date and memo_date and str(cheque_date) > str(memo_date):
        inconsistencies.append("⚠️ Date Contradiction: Cheque issue date is listed after the bank return memo date.")

    # 12. Limitation Warning
    limitation_warn: Optional[str] = None
    if case_info.get("category") == "CHEQUE_BOUNCE" or "cheque" in issue_desc.lower():
        limitation_warn = "⚠️ Statutory Limitation Warning: Under Section 138 NI Act, legal notice must be sent within 30 days of return memo."
    elif any(k in issue_desc.lower() for k in ["contract", "debt", "recovery"]):
        limitation_warn = "⚠️ Limitation Warning: Civil claims general limitation period is 3 years under Limitation Act 1963."

    # 13. Draft Pleading
    draft_pleading = {
        "heading": f"BEFORE THE COMPETENT LEGAL FORUM / COURT FOR {category.upper()}",
        "parties_clause": f"In the matter of: {parties['complainant_applicant']} v. {parties['opposite_party']}",
        "facts_clause": "\n".join([f"{i+1}. {f}" for i, f in enumerate(facts)]),
        "prayer_clause": f"PRAYER: It is humbly prayed that this Hon'ble Forum grant relief: {relief}",
    }

    # Completeness Checker
    if missing_info or not docs_uploaded:
        completeness = "INCOMPLETE"
        disclaimer = "Status: INCOMPLETE. Mandatory information or supporting documents missing."
    else:
        completeness = "COMPLETE"
        disclaimer = "Preliminary completeness check passed. Professional/legal review may still be required."

    return StructuredCasePackage(
        package_title="Judge-Ready Structured Case Package",
        case_summary=summary,
        parties=parties,
        chronology=chronology,
        chronology_of_events=chronology,
        issues=issues,
        legal_issues=issues,
        claims=claims,
        facts=facts,
        relief_requested=relief,
        evidence_list=evidence_list,
        supporting_evidence=evidence_list,
        issue_evidence_matrix=issue_matrix,
        annexure_list=annexure_list,
        annexure_index=annexure_list,
        missing_documents=missing_docs,
        missing_evidence=missing_docs,
        potential_inconsistencies=inconsistencies,
        consistency_warnings=inconsistencies,
        limitation_warning=limitation_warn,
        draft_pleading=draft_pleading,
        applicable_legal_provisions=legal_analysis.get("applicable_laws", []),
        relevant_judgments=legal_analysis.get("relevant_judgments", []),
        completeness_status=completeness,
        court_compliance_disclaimer=disclaimer,
        metadata={
            "session_id": session_state.get("session_id"),
            "category": category,
            "requires_human_review": True,
        },
    )
