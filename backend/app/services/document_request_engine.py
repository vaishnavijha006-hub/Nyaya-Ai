"""
document_request_engine.py — Generates case-type-specific document requirements
and cross-validates uploaded documents against user statements.
"""
import logging
import json
from typing import List, Dict, Any
from app.services.llm import get_groq_client, PRIMARY_MODEL, _is_rate_limit_error, _gemini_fallback

logger = logging.getLogger(__name__)

# ── Static document map by category ───────────────────────────────────────────
DOCUMENT_MAP: Dict[str, List[Dict[str, Any]]] = {
    "tenant_landlord": [
        {"id": "rent_agreement", "label": "Rent/Lease Agreement", "required": True, "reason": "Establishes tenancy terms"},
        {"id": "rent_receipts", "label": "Rent Payment Receipts", "required": True, "reason": "Proves rent was paid"},
        {"id": "payment_proof", "label": "Bank/UPI Payment Proof", "required": False, "reason": "Corroborates payment records"},
        {"id": "landlord_notice", "label": "Any Notice from Landlord", "required": False, "reason": "Shows whether legal notice was given"},
        {"id": "communication", "label": "Messages/Emails with Landlord", "required": True, "reason": "Documents the dispute"},
        {"id": "lockout_photos", "label": "Photos/Videos of Lockout", "required": False, "reason": "Visual evidence of illegal entry"},
        {"id": "id_proof", "label": "ID/Address Proof", "required": True, "reason": "Establishes identity and address"},
        {"id": "police_complaint", "label": "Police Complaint (if filed)", "required": False, "reason": "Criminal record of the dispute"},
    ],
    "consumer_complaint": [
        {"id": "invoice", "label": "Invoice/Bill", "required": True, "reason": "Proof of purchase"},
        {"id": "warranty", "label": "Warranty Card", "required": False, "reason": "Shows warranty terms"},
        {"id": "receipt", "label": "Purchase Receipt", "required": True, "reason": "Transaction record"},
        {"id": "company_communication", "label": "Emails/Letters to Company", "required": True, "reason": "Shows complaint was raised"},
        {"id": "defect_photos", "label": "Photos/Videos of Defect", "required": True, "reason": "Visual evidence of defect"},
        {"id": "complaint_number", "label": "Complaint/Ticket Number", "required": False, "reason": "Reference for escalation"},
    ],
    "employment_dispute": [
        {"id": "appointment_letter", "label": "Appointment/Offer Letter", "required": True, "reason": "Establishes employment terms"},
        {"id": "payslips", "label": "Salary Slips (last 3–6 months)", "required": True, "reason": "Proves employment and salary"},
        {"id": "termination_letter", "label": "Termination/Resignation Letter", "required": False, "reason": "Documents end of employment"},
        {"id": "employment_contract", "label": "Employment Contract/Agreement", "required": True, "reason": "Shows contractual obligations"},
        {"id": "hr_communication", "label": "HR/Management Communications", "required": False, "reason": "Documents the dispute"},
        {"id": "pf_documents", "label": "PF/ESI Documents", "required": False, "reason": "Statutory employment benefits"},
    ],
    "property_dispute": [
        {"id": "title_deed", "label": "Title Deed / Sale Deed", "required": True, "reason": "Establishes ownership"},
        {"id": "property_tax", "label": "Property Tax Receipts", "required": True, "reason": "Corroborates ownership/possession"},
        {"id": "survey_map", "label": "Survey Map / Property Documents", "required": False, "reason": "Identifies property boundaries"},
        {"id": "land_records", "label": "Revenue/Land Records (7/12 or Khatiyan)", "required": True, "reason": "Official ownership record"},
        {"id": "encumbrance", "label": "Encumbrance Certificate", "required": False, "reason": "Shows encumbrances on property"},
    ],
    "criminal_complaint": [
        {"id": "fir", "label": "FIR (First Information Report)", "required": False, "reason": "Official police record if filed"},
        {"id": "injury_report", "label": "Medical/Injury Report", "required": False, "reason": "Documents physical harm"},
        {"id": "witness_statements", "label": "Witness Statements/Details", "required": False, "reason": "Corroborating evidence"},
        {"id": "incident_evidence", "label": "Photos/Videos of Incident", "required": False, "reason": "Direct evidence"},
        {"id": "id_proof", "label": "ID Proof", "required": True, "reason": "Identifies the complainant"},
    ],
    "contract_dispute": [
        {"id": "contract", "label": "Signed Contract/Agreement", "required": True, "reason": "Core document of the dispute"},
        {"id": "amendments", "label": "Contract Amendments", "required": False, "reason": "Modified terms"},
        {"id": "invoices", "label": "Invoices/Purchase Orders", "required": True, "reason": "Transaction records"},
        {"id": "payment_records", "label": "Payment Records", "required": True, "reason": "Proves financial transactions"},
        {"id": "correspondence", "label": "Emails/Letters about the Contract", "required": True, "reason": "Communication trail"},
    ],
    "domestic_family": [
        {"id": "marriage_certificate", "label": "Marriage Certificate", "required": False, "reason": "Proves marital status"},
        {"id": "id_proof", "label": "ID Proof", "required": True, "reason": "Identity document"},
        {"id": "incident_record", "label": "Incident Records / Medical Reports", "required": False, "reason": "Evidence of harm"},
        {"id": "police_complaint", "label": "Police Complaint (if filed)", "required": False, "reason": "Criminal record of the dispute"},
        {"id": "court_orders", "label": "Existing Court Orders", "required": False, "reason": "Prior judicial interventions"},
    ],
    "cybercrime": [
        {"id": "transaction_records", "label": "Transaction Records / Bank Statements", "required": True, "reason": "Proves financial loss"},
        {"id": "screenshots", "label": "Screenshots of Fraudulent Activity", "required": True, "reason": "Digital evidence"},
        {"id": "communication_logs", "label": "Call Logs / Message Records", "required": False, "reason": "Shows contact with perpetrator"},
        {"id": "id_proof", "label": "ID Proof", "required": True, "reason": "Identity document"},
    ],
    "fraud": [
        {"id": "transaction_records", "label": "Transaction Records", "required": True, "reason": "Proves financial fraud"},
        {"id": "agreement", "label": "Any Agreement / Promise Document", "required": False, "reason": "Documents the alleged fraud"},
        {"id": "communication", "label": "Communication Records", "required": True, "reason": "Evidence of misrepresentation"},
        {"id": "id_proof", "label": "ID Proof", "required": True, "reason": "Identity document"},
    ],
    "government_service": [
        {"id": "application", "label": "Application Submitted", "required": True, "reason": "Shows service was requested"},
        {"id": "receipt", "label": "Acknowledgment Receipt", "required": True, "reason": "Proves application submission"},
        {"id": "id_proof", "label": "ID Proof", "required": True, "reason": "Identity document"},
        {"id": "correspondence", "label": "Official Correspondence", "required": False, "reason": "Communication with authority"},
    ],
    "rti": [
        {"id": "rti_application", "label": "RTI Application Copy", "required": True, "reason": "Filed RTI request"},
        {"id": "rti_receipt", "label": "RTI Submission Receipt", "required": True, "reason": "Proof of filing"},
        {"id": "pio_response", "label": "PIO Response (if received)", "required": False, "reason": "First authority's reply"},
        {"id": "id_proof", "label": "ID Proof", "required": True, "reason": "Identity document"},
    ],
    "accident_compensation": [
        {"id": "fir", "label": "FIR / Accident Report", "required": True, "reason": "Official accident record"},
        {"id": "medical_records", "label": "Medical Records / Bills", "required": True, "reason": "Documents injuries and treatment"},
        {"id": "insurance", "label": "Insurance Policy Documents", "required": False, "reason": "Insurance coverage details"},
        {"id": "vehicle_documents", "label": "Vehicle Registration / Documents", "required": False, "reason": "Vehicle involved"},
        {"id": "id_proof", "label": "ID Proof", "required": True, "reason": "Identity document"},
    ],
    "debt_financial": [
        {"id": "loan_agreement", "label": "Loan Agreement", "required": True, "reason": "Establishes debt obligation"},
        {"id": "repayment_records", "label": "Repayment / Payment Records", "required": True, "reason": "Proves payments made"},
        {"id": "bank_statements", "label": "Bank Statements", "required": True, "reason": "Financial transaction history"},
        {"id": "demand_notice", "label": "Demand Notice (if received)", "required": False, "reason": "Creditor's formal demand"},
        {"id": "id_proof", "label": "ID Proof", "required": True, "reason": "Identity document"},
    ],
    "harassment": [
        {"id": "incident_evidence", "label": "Evidence of Harassment (Screenshots, Photos, Recordings)", "required": True, "reason": "Direct evidence"},
        {"id": "complaint_copy", "label": "Internal Complaint Copy (if workplace)", "required": False, "reason": "ICC complaint record"},
        {"id": "witness_details", "label": "Witness Details", "required": False, "reason": "Corroborating witnesses"},
        {"id": "id_proof", "label": "ID Proof", "required": True, "reason": "Identity document"},
    ],
}

DEFAULT_DOCUMENTS = [
    {"id": "id_proof", "label": "ID Proof (Aadhaar/PAN/Passport)", "required": True, "reason": "Identity verification"},
    {"id": "incident_evidence", "label": "Any Evidence Related to the Issue", "required": False, "reason": "Supporting documentation"},
]


def get_required_documents(case_info: dict) -> List[Dict[str, Any]]:
    """Return the list of relevant documents for a given case category."""
    category = (case_info.get("category") or "other").lower()
    docs = DOCUMENT_MAP.get(category, DEFAULT_DOCUMENTS)
    return docs


def format_document_request_message(docs: List[Dict[str, Any]], case_info: dict) -> str:
    """Format a conversational document request message."""
    category_display = (case_info.get("category") or "legal matter").replace("_", " ").title()
    required = [d for d in docs if d.get("required")]
    optional = [d for d in docs if not d.get("required")]

    lines = [
        f"Based on your {category_display} case, I need some documents to analyze your situation properly.",
        "",
        "**Required documents:**",
    ]
    for d in required:
        lines.append(f"• **{d['label']}** — {d['reason']}")

    if optional:
        lines.append("")
        lines.append("**Additional documents (if available):**")
        for d in optional:
            lines.append(f"• {d['label']} — {d['reason']}")

    lines.extend([
        "",
        "Please upload what you have. The AI will analyze the content and let you know if anything is missing.",
        "",
        "⚠️ *Note: Document analysis is AI-assisted. Authenticity must be verified with the issuing authority.*",
    ])
    return "\n".join(lines)


DOC_VERIFY_SYSTEM_PROMPT = """You are an expert legal document analyst for an Indian legal aid system.
You will be given:
1. User's statements about their case
2. Text extracted from their uploaded documents

Your task is to:
1. Identify what type of document this is
2. Extract key facts from the document
3. Check for consistency with the user's statements
4. Identify any contradictions or discrepancies
5. Identify missing information

IMPORTANT RULES:
- Never claim a document is legally authentic. Use language like "appears to show" or "the document text indicates".
- If there is a contradiction, clearly state what the user said vs. what the document shows.
- Do not assume good faith or bad faith — just report facts.

Return ONLY valid JSON:
{
  "document_type": "Identified document type",
  "key_facts_extracted": ["List of key facts from the document"],
  "consistent_with_user_statement": true/false,
  "contradictions": ["List of specific contradictions, if any"],
  "missing_from_document": ["Information mentioned by user not found in document"],
  "document_status": "VERIFIED_CONSISTENT" | "VERIFIED_CONTRADICTIONS" | "UNCLEAR" | "UNREADABLE",
  "verification_note": "A brief note about what the document appears to show",
  "additional_documents_needed": ["Any additional documents suggested by this review"]
}
"""

def verify_document_against_statements(
    user_statements: str,
    document_text: str,
    document_filename: str,
) -> Dict[str, Any]:
    """
    Cross-check extracted document text against user statements.
    Returns a structured verification result.
    """
    if not document_text or len(document_text.strip()) < 20:
        return {
            "document_type": "Unknown",
            "key_facts_extracted": [],
            "consistent_with_user_statement": None,
            "contradictions": [],
            "missing_from_document": [],
            "document_status": "UNREADABLE",
            "verification_note": "The document appears to contain no extractable text or is unreadable.",
            "additional_documents_needed": [],
        }

    client = get_groq_client()
    prompt = (
        f"User's statements:\n{user_statements}\n\n"
        f"Document filename: {document_filename}\n"
        f"Extracted document text:\n{document_text[:3000]}\n\n"
        f"Analyze and return JSON."
    )

    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": DOC_VERIFY_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=600,
        )
        return json.loads(response.choices[0].message.content)
    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning("Groq rate limited in verify_document, falling back to Gemini")
            fallback = DOC_VERIFY_SYSTEM_PROMPT + "\n\nOUTPUT ONLY VALID JSON.\n\n" + prompt
            raw = _gemini_fallback(fallback, "").strip()
            try:
                import re
                match = re.search(r'```(?:json)?\s*([\s\S]*?)```', raw)
                if match:
                    raw = match.group(1)
                return json.loads(raw.strip())
            except Exception:
                pass
        logger.error(f"verify_document failed: {exc}")
        return {
            "document_type": "Unknown",
            "key_facts_extracted": [],
            "consistent_with_user_statement": None,
            "contradictions": [],
            "missing_from_document": [],
            "document_status": "UNCLEAR",
            "verification_note": "Document verification could not be completed at this time.",
            "additional_documents_needed": [],
        }
