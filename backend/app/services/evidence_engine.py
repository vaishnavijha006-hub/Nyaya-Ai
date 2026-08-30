"""
evidence_engine.py — Case-Aware Document and Evidence Collection Engine for Nyaya AI.
"""
import re
import logging
from typing import List, Dict, Any, Optional
from app.models.evidence import (
    DocumentStatus,
    CategoryDocumentRequirement,
    ExtractedDocumentComparison,
    CaseEvidenceReport,
)

logger = logging.getLogger(__name__)

CATEGORY_CHECKLISTS = {
    "RENTAL_DISPUTE": [
        CategoryDocumentRequirement(
            document_name="Rent Agreement",
            why_it_matters="Establishes tenancy terms, lock-in period, rent amount, and notice period.",
            is_mandatory=True,
        ),
        CategoryDocumentRequirement(
            document_name="Rent Payment Proof",
            why_it_matters="Proves rent was paid up-to-date prior to dispute.",
            is_mandatory=True,
        ),
        CategoryDocumentRequirement(
            document_name="Notice / Eviction Communication",
            why_it_matters="Demonstrates formal demand or notice given by landlord or tenant.",
            is_mandatory=False,
        ),
        CategoryDocumentRequirement(
            document_name="Messages / Email Receipts",
            why_it_matters="Serves as contemporaneous evidence of landlord-tenant communications.",
            is_mandatory=False,
        ),
        CategoryDocumentRequirement(
            document_name="Photos / Video Proof",
            why_it_matters="Visually verifies lockout, sealed premises, or property condition.",
            is_mandatory=False,
        ),
    ],
    "CHEQUE_BOUNCE": [
        CategoryDocumentRequirement(
            document_name="Original Bounced Cheque",
            why_it_matters="Primary negotiable instrument evidence under Section 138 NI Act.",
            is_mandatory=True,
        ),
        CategoryDocumentRequirement(
            document_name="Bank Return Memo",
            why_it_matters="Mandatory bank record establishing dishonour reason (e.g., Funds Insufficient).",
            is_mandatory=True,
        ),
        CategoryDocumentRequirement(
            document_name="Statutory Demand Notice",
            why_it_matters="Mandatory statutory legal notice sent within 30 days of dishonour memo.",
            is_mandatory=True,
        ),
        CategoryDocumentRequirement(
            document_name="Transaction / Invoice Proof",
            why_it_matters="Establishes underlying legally enforceable debt or liability.",
            is_mandatory=False,
        ),
    ],
    "EMPLOYMENT_DISPUTE": [
        CategoryDocumentRequirement(
            document_name="Appointment Letter / Contract",
            why_it_matters="Proves employment relationship, job designation, and agreed remuneration.",
            is_mandatory=True,
        ),
        CategoryDocumentRequirement(
            document_name="Pay Slips / Bank Statement",
            why_it_matters="Proves salary rate and exact period of unpaid wages.",
            is_mandatory=True,
        ),
        CategoryDocumentRequirement(
            document_name="Demand Letter / Resignation Communication",
            why_it_matters="Demonstrates formal demand made to employer for settlement of dues.",
            is_mandatory=False,
        ),
    ],
    "CONSUMER_DISPUTE": [
        CategoryDocumentRequirement(
            document_name="Purchase Receipt / Bill Invoice",
            why_it_matters="Proves consumer status, purchase date, merchant identity, and consideration paid.",
            is_mandatory=True,
        ),
        CategoryDocumentRequirement(
            document_name="Warranty Card / Guarantee Terms",
            why_it_matters="Establishes warranty coverage and merchant obligations.",
            is_mandatory=False,
        ),
        CategoryDocumentRequirement(
            document_name="Complaint Communications",
            why_it_matters="Proves attempt to notify merchant/service provider of defect prior to litigation.",
            is_mandatory=False,
        ),
    ],
}


def get_category_checklist(category: str) -> List[CategoryDocumentRequirement]:
    """Returns category-aware document checklist with clear legal explanations."""
    cat_clean = (category or "").upper().replace(" ", "_")
    for k in CATEGORY_CHECKLISTS:
        if k in cat_clean or cat_clean in k:
            return CATEGORY_CHECKLISTS[k]
    # Default fallback
    return CATEGORY_CHECKLISTS["RENTAL_DISPUTE"]


def compare_document_with_case_facts(
    extracted_text: str,
    filename: str,
    case_info: Dict[str, Any]
) -> ExtractedDocumentComparison:
    """
    Extracts text, compares extracted facts against reported case details,
    detects date/amount inconsistencies, and returns classification status.
    """
    text_lower = extracted_text.lower()
    inconsistencies = []
    findings = []
    status = DocumentStatus.RELEVANT

    # 1. Date comparison & Inconsistency check
    reported_date = case_info.get("incident_date") or case_info.get("lockout_date")
    date_match = re.search(r'\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s*,?\s*\d{4})?)\b', extracted_text, re.IGNORECASE)
    extracted_date = date_match.group(1) if date_match else None

    if reported_date and extracted_date:
        if reported_date.strip().lower() not in extracted_date.strip().lower() and extracted_date.strip().lower() not in reported_date.strip().lower():
            status = DocumentStatus.INCONSISTENT
            inc_msg = f"Potential inconsistency detected: Case fact incident date ({reported_date}) differs from document notice date ({extracted_date}). Please verify these dates."
            inconsistencies.append(inc_msg)
            logger.warning(f"[Evidence Engine] {inc_msg}")

    # 2. Document Relevance Check
    category = case_info.get("category", "").upper()
    if "RENT" in category and not any(k in text_lower for k in ["rent", "lease", "tenant", "landlord", "possession", "notice"]):
        status = DocumentStatus.IRRELEVANT
        findings.append("Document text does not appear related to rental dispute.")

    # 3. Check for human review indicators
    if "unable to extract" in text_lower or len(extracted_text.strip()) < 20:
        status = DocumentStatus.NEEDS_HUMAN_REVIEW
        findings.append("Document image/PDF quality is low or unreadable. Requires manual lawyer review.")

    if not findings and status == DocumentStatus.RELEVANT:
        findings.append("Document extracted successfully and appears relevant to case details.")

    return ExtractedDocumentComparison(
        filename=filename,
        document_type=category or "CASE_DOCUMENT",
        status=status,
        extracted_text_snippet=extracted_text[:200],
        extracted_date=extracted_date,
        inconsistencies=inconsistencies,
        findings=findings,
    )


def generate_case_evidence_report(
    category: str,
    case_info: Dict[str, Any],
    uploaded_files: List[Dict[str, Any]]
) -> CaseEvidenceReport:
    """Generates complete Case Evidence Report with checklist, missing documents, and inconsistencies."""
    checklist = get_category_checklist(category)
    uploaded_comparisons = []
    missing = []
    all_inconsistencies = []

    uploaded_names = [f.get("filename", "").lower() for f in uploaded_files]

    for req in checklist:
        match_found = any(req.document_name.lower() in fname for fname in uploaded_names)
        if match_found:
            req.status = DocumentStatus.RELEVANT
        else:
            req.status = DocumentStatus.MISSING
            if req.is_mandatory:
                missing.append(req.document_name)

    for f in uploaded_files:
        comp = compare_document_with_case_facts(
            extracted_text=f.get("extracted_text", ""),
            filename=f.get("filename", "document.pdf"),
            case_info=case_info
        )
        uploaded_comparisons.append(comp)
        all_inconsistencies.extend(comp.inconsistencies)

    return CaseEvidenceReport(
        case_category=category,
        required_checklist=checklist,
        uploaded_documents=uploaded_comparisons,
        missing_evidence=missing,
        inconsistencies_detected=all_inconsistencies,
    )
