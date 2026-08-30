"""
legal_journey_engine.py — Comprehensive 5-stage Legal Assistance Journey Engine.
Orchestrates problem classification, document requirements, document verification check,
statutory rights, landmark judgments, Section 12 DLSA legal aid evaluation, and nearest DLSA location.
"""

import json
import logging
from typing import Dict, Any, List, Optional

from app.services.case_intake import extract_case_info_real
from app.services.legal_aid_eligibility import evaluate_eligibility
from app.services.dlsa_directory import get_nearest_dlsa
from app.services.llm import get_groq_client, PRIMARY_MODEL, _is_rate_limit_error, _gemini_fallback

logger = logging.getLogger(__name__)

# Standard required document matrix by legal category in Indian law
REQUIRED_DOCUMENTS_MATRIX = {
    "CHEQUE_BOUNCE": [
        {"name": "Bank Return Memo", "importance": "Mandatory", "description": "Official memo from bank stating reason for cheque dishonour (e.g. Funds Insufficient)."},
        {"name": "Original Bounced Cheque", "importance": "Mandatory", "description": "Original cheque dishonoured by the bank."},
        {"name": "Legal Demand Notice & Delivery Proof", "importance": "Mandatory", "description": "Copy of 15-day statutory demand notice sent under Section 138 NI Act with speed post tracking receipt."},
        {"name": "Transaction Proof / Agreement", "importance": "Recommended", "description": "Invoice, contract, or ledger showing legally enforceable debt."}
    ],
    "RENTAL_DISPUTE": [
        {"name": "Rent Agreement / Lease Deed", "importance": "Mandatory", "description": "Signed rental agreement specifying rent, lock-in period, and terms."},
        {"name": "Rent Payment Receipts / Bank Statements", "importance": "Mandatory", "description": "Proof of monthly rent transfers or rent receipts."},
        {"name": "Notice / Eviction Communication", "importance": "Recommended", "description": "WhatsApp, email, or written notice received from landlord/tenant."},
        {"name": "Police Intimation / Complaint (if lockout occurred)", "importance": "Recommended", "description": "Copy of police complaint if illegal lockout occurred."}
    ],
    "EMPLOYMENT_DISPUTE": [
        {"name": "Employment Offer Letter / Contract", "importance": "Mandatory", "description": "Contract detailing salary, designation, and notice period."},
        {"name": "Salary Slips / Bank Account Statement", "importance": "Mandatory", "description": "Proof of last credited salary and unpaid period."},
        {"name": "Termination / Resignation Email", "importance": "Mandatory", "description": "Written notice or email communication regarding severance or unpaid dues."}
    ],
    "CONSUMER_DISPUTE": [
        {"name": "Purchase Invoice / Cash Memo", "importance": "Mandatory", "description": "Bill showing product/service description and payment amount."},
        {"name": "Warranty / Guarantee Card", "importance": "Recommended", "description": "Terms of warranty or service SLA."},
        {"name": "Written Complaint & Seller Response", "importance": "Mandatory", "description": "Proof of formal complaint sent to vendor/company."}
    ],
    "DEFAULT": [
        {"name": "Identity Proof (Aadhaar / Voter ID)", "importance": "Mandatory", "description": "Official ID proof of complainant."},
        {"name": "Written Complaint / Incident Statement", "importance": "Mandatory", "description": "Detailed written account of dates, times, and facts."},
        {"name": "Supporting Photos / Video / Audio Evidence", "importance": "Recommended", "description": "Any visual or digital proof related to the dispute."}
    ]
}


def get_required_documents(category: Optional[str] = None) -> List[Dict[str, str]]:
    """Returns required document list for a specific legal category."""
    cat = (category or "").upper()
    for k in REQUIRED_DOCUMENTS_MATRIX:
        if k in cat or cat in k:
            return REQUIRED_DOCUMENTS_MATRIX[k]
    return REQUIRED_DOCUMENTS_MATRIX["DEFAULT"]


def retrieve_rights_and_judgments(category: str, issue: str) -> Dict[str, Any]:
    """Retrieves statutory legal rights and landmark Indian judgments using LLM grounding."""
    client = get_groq_client()
    system_prompt = (
        "You are an expert Indian Legal Scholar. Output ONLY valid JSON matching this exact structure:\n"
        "{\n"
        '  "statutory_rights": [\n'
        '    {"act": "Act Name", "section": "Section number", "right_description": "Explanation"}\n'
        '  ],\n'
        '  "landmark_judgments": [\n'
        '    {"case_name": "Case Title", "court_year": "Court Name and Year", "key_ruling": "Principle"}\n'
        '  ]\n'
        "}"
    )
    user_prompt = f"Category: {category}\nLegal Issue: {issue}\nProvide 2 statutory rights and 2 landmark court judgments."

    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=1200,
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.warning(f"LLM rights retrieval failed ({e}), returning default legal citations.")
        return {
            "statutory_rights": [
                {
                    "act": "Constitution of India / Applicable Code",
                    "section": "Article 21 & Article 39A",
                    "right_description": "Right to fair legal procedure and free legal aid for citizens."
                }
            ],
            "landmark_judgments": [
                {
                    "case_name": "Hussainara Khatoon v. Home Secretary, State of Bihar (1979)",
                    "court_year": "Supreme Court of India, 1979",
                    "key_ruling": "Right to free legal aid and speedy trial is a fundamental right under Article 21."
                }
            ]
        }


def process_legal_journey(
    user_input: str,
    user_profile: Optional[Dict[str, Any]] = None,
    uploaded_doc_names: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Executes the full 5-stage legal journey analysis.
    """
    if user_profile is None:
        user_profile = {}
    if uploaded_doc_names is None:
        uploaded_doc_names = []

    # Stage 1: Case Info Extraction
    case_info = extract_case_info_real(user_input)
    category = case_info.get("category") or "GENERAL_LEGAL"

    # Stage 2: Required Docs vs Uploaded Docs
    required_docs = get_required_documents(category)
    uploaded_lower = [d.lower() for d in uploaded_doc_names]
    
    missing_docs = []
    verified_docs = []
    
    for rdoc in required_docs:
        doc_name = rdoc["name"]
        # Match if uploaded doc contains keywords
        keywords = doc_name.lower().split()
        matched = any(any(kw in udoc for kw in keywords if len(kw) > 3) for udoc in uploaded_lower)
        if matched:
            verified_docs.append(rdoc)
        else:
            missing_docs.append(rdoc)

    # Stage 3: Rights & Judgments
    rights_data = retrieve_rights_and_judgments(category, case_info.get("issue", user_input))

    # Stage 4: DLSA Legal Aid Evaluation
    legal_aid_result = evaluate_eligibility(user_profile)

    # Stage 5: Nearest DLSA Office & Lawyer Network Recommendation
    state = user_profile.get("state") or case_info.get("location")
    district = user_profile.get("district")
    dlsa_info = get_nearest_dlsa(state=state, district=district)

    # If ineligible for government aid, provide lawyer network suggestions
    lawyer_network_recommendation = None
    if not legal_aid_result.get("eligible"):
        cat_clean = category.replace("_", " ").title()
        lawyer_network_recommendation = {
            "suggested": True,
            "title": "Legal Saathi Lawyer Network Recommendation",
            "message": f"Since your profile exceeds government legal aid income thresholds, we recommend consulting verified advocates in {cat_clean} from the Legal Saathi network.",
            "specialization_needed": cat_clean,
            "action_text": "Connect with Local Advocate",
            "options": [
                {"name": f"Senior Advocate ({cat_clean} Specialist)", "experience": "12+ Years", "location": f"{district or state or 'Local'} Bar Association"},
                {"name": f"Legal Aid Panel Practitioner", "experience": "8+ Years", "location": f"{district or 'District'} High Court Chambers"}
            ]
        }

    return {
        "case_summary": {
            "category": category,
            "sub_category": case_info.get("sub_category"),
            "issue": case_info.get("issue", user_input),
            "urgency": case_info.get("urgency", "Medium")
        },
        "document_analysis": {
            "required_documents": required_docs,
            "verified_documents": verified_docs,
            "missing_documents": missing_docs,
            "all_documents_present": len(missing_docs) == 0
        },
        "legal_rights_and_judgments": rights_data,
        "legal_aid_eval": legal_aid_result,
        "nearest_dlsa": dlsa_info,
        "lawyer_network": lawyer_network_recommendation
    }
