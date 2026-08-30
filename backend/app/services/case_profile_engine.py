"""
case_profile_engine.py — Case Understanding Engine for Nyaya AI.

Progressively constructs a 13-field Case Profile with confidence scores,
single-question progressive intake, and explicit Fact Conflict detection.
"""
import re
import logging
from typing import Dict, Any, Optional, List
from app.models.case_profile import CaseProfile, ExtractedFactItem, FactConflict

logger = logging.getLogger(__name__)


def _extract_facts_with_confidence(user_input: str) -> List[ExtractedFactItem]:
    """Extracts facts from natural language user input with confidence scores."""
    facts = []
    text_lower = user_input.lower().strip()

    # 1. Date Extraction
    date_match = re.search(
        r'\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s*,?\s*\d{4})?)\b',
        user_input, re.IGNORECASE
    )
    digit_date_match = re.search(r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b', user_input)
    
    if date_match:
        facts.append(ExtractedFactItem(field="incident_date", value=date_match.group(1), confidence=0.98))
    elif digit_date_match:
        facts.append(ExtractedFactItem(field="incident_date", value=digit_date_match.group(1), confidence=0.95))
    elif "yesterday" in text_lower:
        facts.append(ExtractedFactItem(field="incident_date", value="yesterday", confidence=0.90))

    # 2. Location Extraction
    cities = ["delhi", "ghaziabad", "noida", "gurugram", "mumbai", "bangalore", "bengaluru", "hyderabad", "pune", "chennai", "kolkata", "jaipur", "lucknow"]
    for city in cities:
        if city in text_lower:
            facts.append(ExtractedFactItem(field="incident_location", value=city.capitalize(), confidence=0.95))
            break

    # 3. Category & Subcategory Extraction
    if "landlord" in text_lower or "lockout" in text_lower or "rent" in text_lower:
        facts.append(ExtractedFactItem(field="case_category", value="RENTAL_DISPUTE", confidence=0.95))
        if "lockout" in text_lower or "locked" in text_lower:
            facts.append(ExtractedFactItem(field="subcategory", value="Illegal Lockout", confidence=0.95))
    elif "cheque" in text_lower or "bounced" in text_lower:
        facts.append(ExtractedFactItem(field="case_category", value="CHEQUE_BOUNCE", confidence=0.95))
        facts.append(ExtractedFactItem(field="subcategory", value="Section 138 NI Act", confidence=0.95))
    elif "salary" in text_lower or "employer" in text_lower:
        facts.append(ExtractedFactItem(field="case_category", value="EMPLOYMENT_DISPUTE", confidence=0.92))
        facts.append(ExtractedFactItem(field="subcategory", value="Unpaid Wages", confidence=0.92))

    # 4. Opposite Party Extraction
    if "landlord" in text_lower:
        facts.append(ExtractedFactItem(field="opposite_party", value="Landlord", confidence=0.90))
        facts.append(ExtractedFactItem(field="parties", value="Tenant (User) vs Landlord", confidence=0.90))
    elif "employer" in text_lower or "company" in text_lower:
        facts.append(ExtractedFactItem(field="opposite_party", value="Employer / Company", confidence=0.90))
        facts.append(ExtractedFactItem(field="parties", value="Employee (User) vs Employer", confidence=0.90))

    # 5. Documents Available Extraction
    if any(k in text_lower for k in ["rent agreement", "lease agreement"]):
        facts.append(ExtractedFactItem(field="documents_available", value="Rent Agreement", confidence=0.92))
    if any(k in text_lower for k in ["cheque copy", "bank memo", "return memo"]):
        facts.append(ExtractedFactItem(field="documents_available", value="Bank Return Memo", confidence=0.92))

    return facts


def build_progressive_case_profile(
    user_input: str,
    current_profile: Optional[CaseProfile] = None,
    session_state: Optional[Dict[str, Any]] = None,
) -> CaseProfile:
    """
    Progressively builds Case Profile, detects fact conflicts, and selects next single question.
    """
    if current_profile is None:
        profile_dict = {}
        if session_state and session_state.get("case_profile"):
            profile = CaseProfile(**session_state["case_profile"])
        else:
            profile = CaseProfile()
    else:
        profile = current_profile.model_copy(deep=True)

    new_fact_items = _extract_facts_with_confidence(user_input)

    # 1. Process Extracted Facts & Check Conflicts
    for fact in new_fact_items:
        field_name = fact.field
        new_val = fact.value
        existing_val = getattr(profile, field_name, None)

        if existing_val and existing_val != new_val:
            # Check if this is a conflicting scalar value (e.g. date change)
            if field_name in ["incident_date", "incident_location", "opposite_party"]:
                conflict_msg = (
                    f"FACT CONFLICT: You previously stated {field_name.replace('_', ' ')} was '{existing_val}', "
                    f"but now mentioned '{new_val}'. Could you please clarify which is correct?"
                )
                conflict = FactConflict(
                    field=field_name,
                    existing_value=existing_val,
                    new_value=new_val,
                    conflict_message=conflict_msg
                )
                profile.conflicts.append(conflict)
                profile.has_active_conflict = True
                profile.next_single_question = conflict_msg
                logger.warning(f"[CaseProfile conflict] Field {field_name}: '{existing_val}' vs '{new_val}'")
                continue

        # Set or append fact value
        if field_name == "documents_available":
            if new_val not in profile.documents_available:
                profile.documents_available.append(new_val)
        else:
            setattr(profile, field_name, new_val)

        # Add to extracted_facts provenance log
        profile.extracted_facts.append(fact)

        # Update Chronology
        if field_name == "incident_date" and new_val:
            event_desc = f"Incident occurred ({profile.subcategory or 'Legal Dispute'})"
            if not any(c.get("date") == new_val for c in profile.chronology):
                profile.chronology.append({"date": new_val, "event": event_desc})

    # 2. Update Claims, Harm Suffered & Relief Requested Defaults
    if profile.case_category == "RENTAL_DISPUTE":
        profile.claims = ["Illegal lockout", "Possession recovery", "Security deposit refund"]
        profile.harm_suffered = "Loss of shelter and property access"
        profile.relief_requested = "Restoration of possession and restraint order"
        profile.missing_documents = ["Rent Agreement", "Rent Receipts", "Police Intimation Letter"]
    elif profile.case_category == "CHEQUE_BOUNCE":
        profile.claims = ["Dishonour of cheque under Sec 138 NI Act"]
        profile.harm_suffered = "Financial loss due to non-payment"
        profile.relief_requested = "Recovery of cheque amount plus interest"
        profile.missing_documents = ["Original Cheque", "Bank Return Memo", "Legal Notice Acknowledgment"]

    # 3. Calculate Important Unanswered Questions
    profile.important_unanswered_questions = []
    if not profile.incident_date:
        profile.important_unanswered_questions.append("On what exact date did this incident occur?")
    if not profile.incident_location:
        profile.important_unanswered_questions.append("In which city or district is the property/incident located?")
    if not profile.documents_available:
        profile.important_unanswered_questions.append("Do you have any written contract, notice, or document for this matter?")

    # 4. Determine Single Progressive Question
    if not profile.has_active_conflict and profile.important_unanswered_questions:
        profile.next_single_question = profile.important_unanswered_questions[0]
    elif not profile.has_active_conflict and not profile.important_unanswered_questions:
        profile.next_single_question = "All key profile details gathered. Would you like to view your Case Profile summary?"

    return profile
