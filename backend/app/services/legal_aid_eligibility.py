"""
legal_aid_eligibility.py — Deterministic Rule Engine for Legal Aid & DLSA under Section 12.

Section 12 of the Legal Services Authorities Act, 1987.
Evaluates eligibility deterministically without relying on an LLM for final decisions.
"""
import logging
import re
from typing import Dict, Any, List, Optional
from app.models.legal_aid_enhanced import LegalAidAssessment, LegalAidStatus

logger = logging.getLogger(__name__)

ELIGIBILITY_QUESTIONS = [
    {
        "id": "state",
        "question": "Which state are you located in?",
        "type": "text",
        "field": "state",
    },
    {
        "id": "district",
        "question": "Which district are you from?",
        "type": "text",
        "field": "district",
    },
    {
        "id": "annual_income",
        "question": "Approximately what is your annual household income?",
        "type": "number",
        "field": "annual_income",
    },
    {
        "id": "gender",
        "question": "What is your gender?",
        "type": "choice",
        "options": ["Male", "Female", "Other/Prefer not to say"],
        "field": "gender",
    },
    {
        "id": "category",
        "question": "Do you belong to any social category?",
        "type": "choice",
        "options": ["Scheduled Caste (SC)", "Scheduled Tribe (ST)", "OBC", "General/None"],
        "field": "caste_category",
    },
    {
        "id": "disability",
        "question": "Do you have a disability?",
        "type": "choice",
        "options": ["Yes", "No"],
        "field": "disability",
    },
    {
        "id": "custody",
        "question": "Are you currently in judicial/protective custody?",
        "type": "choice",
        "options": ["Yes", "No"],
        "field": "in_custody",
    },
]


def get_next_eligibility_question(profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    for q in ELIGIBILITY_QUESTIONS:
        field = q["field"]
        if field not in profile or profile[field] is None or str(profile[field]).strip() == "":
            return q
    return None


def parse_eligibility_answer(question_id: str, answer: str) -> Dict[str, Any]:
    q_map = {q["id"]: q for q in ELIGIBILITY_QUESTIONS}
    q = q_map.get(question_id)
    if not q:
        return {}

    field = q["field"]
    answer = answer.strip()

    if field == "annual_income":
        numbers = re.findall(r"[\d,]+", answer.replace(",", ""))
        if numbers:
            try:
                val = int(numbers[0])
                if val < 1000 and "lakh" in answer.lower():
                    val = val * 100000
                elif val < 100 and ("cr" in answer.lower() or "crore" in answer.lower()):
                    val = val * 10000000
                return {field: val}
            except Exception:
                pass
        return {field: None}
    elif field == "disability":
        return {field: answer.lower().startswith("y")}
    elif field == "in_custody":
        return {field: answer.lower().startswith("y")}
    elif field == "gender":
        if "female" in answer.lower() or "woman" in answer.lower() or "महिला" in answer:
            return {field: "female"}
        elif "male" in answer.lower() or "man" in answer.lower() or "पुरुष" in answer:
            return {field: "male"}
        return {field: "other"}
    elif field == "caste_category":
        ans_lower = answer.lower()
        if "sc" in ans_lower or "scheduled caste" in ans_lower:
            return {field: "sc"}
        elif "st" in ans_lower or "scheduled tribe" in ans_lower:
            return {field: "st"}
        elif "obc" in ans_lower:
            return {field: "obc"}
        return {field: "general"}
    else:
        return {field: answer}


def evaluate_eligibility(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy helper function returning dictionary."""
    res = evaluate_legal_aid_deterministic(profile)
    return res.model_dump()


def evaluate_legal_aid_deterministic(
    profile: Dict[str, Any],
    case_info: Optional[Dict[str, Any]] = None,
) -> LegalAidAssessment:
    """
    Deterministic Legal Aid Rule Engine under Section 12 of the Legal Services Authorities Act, 1987.
    Evaluates profile against 4 statutory outcomes:
    - Eligible
    - Potentially Eligible
    - Not Eligible Based on Available Information
    - Insufficient Information
    """
    if case_info is None:
        case_info = {}

    annual_income = profile.get("annual_income")
    gender = (profile.get("gender") or "").lower()
    caste = (profile.get("caste_category") or "").lower()
    disability = profile.get("disability", False)
    in_custody = profile.get("in_custody", False)
    trafficking = profile.get("victim_of_trafficking", False)
    workman = profile.get("industrial_workman", False)
    state = profile.get("state") or case_info.get("location") or "Delhi"
    district = profile.get("district") or case_info.get("location") or "Central District"

    matched_criteria: List[str] = []
    missing_information: List[str] = []

    # Track missing fields
    if annual_income is None:
        missing_information.append("Annual household income (Section 12(h))")
    if not profile.get("gender"):
        missing_information.append("Gender (Section 12(c))")
    if not profile.get("caste_category"):
        missing_information.append("Caste / Social Category (Section 12(a))")

    # Evaluate Statutory Criteria (Section 12 LSA Act 1987)
    if caste in ["sc", "st"]:
        matched_criteria.append("Member of Scheduled Caste or Scheduled Tribe [Section 12(a)]")
    if trafficking:
        matched_criteria.append("Victim of trafficking, begar, or forced labour [Section 12(b)]")
    if gender in ["female", "woman", "other"]:
        matched_criteria.append("Woman or child applicant entitled to free legal aid [Section 12(c)]")
    if disability:
        matched_criteria.append("Person with disability [Section 12(d)]")
    if in_custody:
        matched_criteria.append("Person in custody or protective home/observation facility [Section 12(e)]")
    if workman:
        matched_criteria.append("Industrial workman [Section 12(f)]")

    INCOME_THRESHOLD = 300000  # Rs. 3 Lakhs per annum standard baseline
    income_matched = False
    income_near_threshold = False

    if annual_income is not None:
        if annual_income < INCOME_THRESHOLD:
            income_matched = True
            matched_criteria.append(f"Annual household income (Rs. {annual_income:,}) below standard Rs. {INCOME_THRESHOLD:,} threshold [Section 12(h)]")
        elif annual_income <= INCOME_THRESHOLD * 1.25:
            income_near_threshold = True

    # 4 Status Determination
    if matched_criteria:
        status = LegalAidStatus.ELIGIBLE
        explanation = (
            f"Applicant deterministically qualifies for free government legal aid under Section 12 of the Legal Services Authorities Act, 1987. "
            f"Matched criteria: {'; '.join(matched_criteria)}."
        )
    elif income_near_threshold or caste == "obc":
        status = LegalAidStatus.POTENTIALLY_ELIGIBLE
        explanation = (
            "Applicant is Potentially Eligible for legal aid. While baseline criteria require DLSA state-specific income threshold verification, "
            "the reported profile warrants submission for District Legal Services Authority (DLSA) review."
        )
    elif annual_income is not None and annual_income > INCOME_THRESHOLD * 1.25 and not matched_criteria:
        status = LegalAidStatus.NOT_ELIGIBLE
        explanation = (
            f"Based on available information, annual household income (Rs. {annual_income:,}) exceeds statutory legal aid threshold (Rs. {INCOME_THRESHOLD:,}) "
            "and no automatic Section 12 criteria (SC/ST, Woman, Disability, Custody) were met."
        )
    else:
        status = LegalAidStatus.INSUFFICIENT_INFO
        explanation = (
            "Legal aid eligibility cannot be established due to insufficient profile information. "
            f"Missing required fields: {', '.join(missing_information[:2])}."
        )

    # Next Steps, Documents, and Location Guidance
    what_to_do_next = [
        f"1. Visit the Legal Aid Front Office at the District Court Complex in {district}, {state}.",
        "2. Request Form-1 (Application for Free Legal Services) from the DLSA Front Office.",
        "3. Attach required verification documents and submit the application.",
        "4. Obtain a stamped acknowledgment receipt with case tracking number.",
        "5. Upon Member Secretary approval, a panel advocate will be assigned at zero cost.",
    ]

    documents_to_prepare = [
        "Identity Proof (Aadhaar Card / Voter ID / Passport)",
        "Address Proof (Electricity Bill / Rent Agreement / Ration Card)",
        "Income Certificate / BPL Card / Salary Slip (if applying under income criterion)",
        "Category Certificate (SC/ST Certificate issued by competent authority, if applicable)",
        "Disability Certificate issued by competent medical board (if applicable)",
        "Dispute Documents (Copy of notice, police complaint, or contract)",
    ]

    location_guidance = {
        "authority_name": f"District Legal Services Authority (DLSA), {district}",
        "jurisdiction": f"{district}, {state}",
        "office_location": f"District Court Complex, {district}, {state}",
        "national_portal": "https://nalsa.gov.in",
        "national_helpline": "15100 (NALSA Toll-Free Helpline)",
        "note": "Official DLSA office is located inside the District Court Complex. No fee is charged for legal aid applications.",
    }

    return LegalAidAssessment(
        status=status,
        matched_criteria=matched_criteria,
        missing_information=missing_information,
        explanation=explanation,
        what_to_do_next=what_to_do_next,
        next_steps=what_to_do_next,
        documents_to_prepare=documents_to_prepare,
        document_checklist=documents_to_prepare,
        legal_services_authority_pathway="District Legal Services Authority (DLSA) / Taluk Legal Services Committee (TLSC)",
        location_specific_guidance=location_guidance,
        appropriate_authority=location_guidance,
        application_guidance=what_to_do_next,
        is_deterministic=True,
        metadata={
            "profile": profile,
            "state": state,
            "district": district,
            "is_paid_lawyer_separated": True,
        },
    )
