import json
import logging
import re
from typing import List, Dict, Any, Optional
from app.services.llm import get_groq_client, PRIMARY_MODEL, _is_rate_limit_error, _gemini_fallback
from app.services.translator import translate_text

logger = logging.getLogger(__name__)

CASE_INTAKE_SYSTEM_PROMPT = """You are an expert Indian Legal AI intake assistant.
Your task is to extract structured case information from a conversation and determine what critical information is still missing.

Return ONLY a valid JSON object. Keep all facts and evidence from the EXISTING CASE STATE.
Do not overwrite existing facts with null.

Base Fields:
{
  "category": "CHEQUE_BOUNCE, RENTAL_DISPUTE, DOMESTIC_VIOLENCE, CONSUMER_DISPUTE, EMPLOYMENT_DISPUTE, PROPERTY_DISPUTE, etc.",
  "sub_category": "Specific sub-type (e.g. lockout, dishonour, unpaid salary)",
  "issue": "Brief summary",
  "parties": "...",
  "location": "...",
  "case_stage": "...",
  "urgency": "...",
  "desired_outcome": "...",
  "key_facts": ["List of specific facts"],
  "evidence_available": ["..."],
  "missing_information": ["List of CRITICAL missing details needed (field names)"],
  "collected_fields": {"field_name": true},
  "has_immediate_safety_concern": false,
  "classification_status": "COMPLETE or INCOMPLETE"
}

Specific Category Fields (add these to the JSON if applicable):
- CHEQUE_BOUNCE: "cheque_amount", "cheque_date", "presentation_date", "dishonour_reason", "return_memo_date", "transaction_purpose", "drawer_name", "legal_notice_sent", "legal_notice_date", "notice_delivery_status", "payment_received_after_notice"
- RENTAL_DISPUTE (or lockout): "lockout_date", "lockout_time", "property_location", "rent_agreement_exists", "police_informed"
- EMPLOYMENT_DISPUTE: "employer_name", "unpaid_period", "salary_amount", "employment_contract_exists"
- CONSUMER_DISPUTE: "product_service", "vendor_name", "purchase_date", "purchase_amount", "complaint_raised"

Rules:
1. CRITICAL: Never overwrite already collected information with empty/null values.
2. For missing_information, list only the field names that are strictly necessary and NOT yet in collected_fields.
3. Normalize dates/times (e.g., "18 August 2026 at 11:20 PM" -> "2026-08-18 23:20").
4. If collected_fields shows a fact is true, it MUST NOT be in missing_information.
5. If the user gives a short response like "yes", DO NOT reset the category or lose facts.
"""

FIELD_QUESTION_TEMPLATES = {
    "lockout_date": "When did the lockout happen?",
    "incident_date": "On what date did the incident happen?",
    "lockout_time": "What approximate time did the lockout happen?",
    "incident_time": "What approximate time did this occur?",
    "property_location": "Where is the property located?",
    "location": "In which city or area did this occur?",
    "rent_agreement_exists": "Do you have a written rent agreement for the property?",
    "rent_agreement": "Do you have a written rent agreement for the property?",
    "rent_payment_status": "Are your rent payments currently up to date?",
    "police_informed": "Have you reported this incident to the police?",
    "police_complaint": "Have you filed a formal complaint with the police?",
    "cheque_amount": "What was the exact amount on the bounced cheque?",
    "cheque_date": "On what date was the cheque issued?",
    "dishonour_reason": "What was the official reason given by the bank for the cheque dishonour?",
    "return_memo_date": "When did you receive the bank return memo?",
    "transaction_purpose": "What was the purpose of the transaction for which the cheque was given?",
    "drawer_name": "Who issued the cheque to you?",
    "legal_notice_sent": "Have you issued a written legal demand notice to the drawer?",
    "legal_notice_date": "When was the legal demand notice sent?",
    "notice_delivery_status": "Was the legal notice delivered to the recipient?",
    "employer_name": "What is the name of your employer or company?",
    "unpaid_period": "For how many months or weeks has your salary been unpaid?",
    "product_service": "What product or service did you purchase?",
    "vendor_name": "What is the name of the seller or company?",
    "purchase_amount": "How much money did you pay for this purchase?",
}


def _heuristic_fact_extraction(user_input: str, current_state: Optional[dict] = None) -> dict:
    """Deterministic natural language extraction for dates, times, locations, booleans, amounts."""
    extracted = {}
    text_lower = user_input.lower().strip()
    
    # 1. Date & Time regex matching
    date_match = re.search(
        r'\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s*,?\s*\d{4})?)\b',
        user_input, re.IGNORECASE
    )
    digit_date_match = re.search(r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b', user_input)
    
    time_match = re.search(r'\b(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))\b', user_input)
    approx_time_match = re.search(r'\b(?:at|around|approx|approximately)\s*(\d{1,2}(?::\d{2})?\s*(?:PM|AM|pm|am)?)\b', user_input, re.IGNORECASE)

    extracted_date = None
    if date_match:
        extracted_date = date_match.group(1)
    elif digit_date_match:
        extracted_date = digit_date_match.group(1)
    elif "yesterday" in text_lower:
        extracted_date = "yesterday"
    elif "last night" in text_lower:
        extracted_date = "last night"

    extracted_time = None
    if time_match:
        extracted_time = time_match.group(1)
    elif approx_time_match:
        extracted_time = approx_time_match.group(1)
    elif "11:20 pm" in text_lower or "11:20pm" in text_lower:
        extracted_time = "23:20"

    if extracted_date:
        extracted["incident_date"] = extracted_date
        extracted["lockout_date"] = extracted_date
    if extracted_time:
        extracted["incident_time"] = extracted_time
        extracted["lockout_time"] = extracted_time

    # 2. Location extraction heuristics
    cities = ["ghaziabad", "delhi", "noida", "gurugram", "mumbai", "bangalore", "bengaluru", "hyderabad", "pune", "chennai", "kolkata", "jaipur", "lucknow"]
    for city in cities:
        if city in text_lower:
            extracted["location"] = city.capitalize()
            extracted["property_location"] = city.capitalize()
            break

    # 3. Rent agreement & Police boolean heuristics
    if any(k in text_lower for k in ["rent agreement", "rental agreement", "lease agreement"]):
        if any(w in text_lower for w in ["yes", "have", "with me", "signed", "written", "do have", "i have"]):
            extracted["rent_agreement_exists"] = True
            extracted["rent_agreement"] = True
        elif any(w in text_lower for w in ["no", "don't", "do not", "without", "oral"]):
            extracted["rent_agreement_exists"] = False
            extracted["rent_agreement"] = False

    if "police" in text_lower:
        if any(w in text_lower for w in ["yes", "informed", "filed", "complained", "called", "reported"]):
            extracted["police_informed"] = True
            extracted["police_complaint"] = True
        elif any(w in text_lower for w in ["no", "haven't", "not yet", "didn't"]):
            extracted["police_informed"] = False

    # 4. Short yes/no answer resolution based on target field
    if current_state:
        missing = current_state.get("missing_information", [])
        asked = current_state.get("asked_questions", [])
        target_field = None
        if asked and isinstance(asked[-1], dict) and asked[-1].get("field"):
            target_field = asked[-1]["field"]
        elif missing:
            target_field = missing[0]

        if target_field:
            if text_lower in ["yes", "yep", "yeah", "i do", "true", "sent", "filed", "informed"]:
                extracted[target_field] = True
            elif text_lower in ["no", "nope", "nah", "i don't", "false", "not yet", "haven't"]:
                extracted[target_field] = False
            elif text_lower in ["not sure", "don't know", "unclear"]:
                extracted[target_field] = "unclear"

    # 5. Cheque bounce amount heuristics
    amount_match = re.search(r'\b(?:rs\.?|inr|rupees|amount of|cheque for)?\s*([\d,]+)\s*(?:lakh|lakhs|k|thousand)?\b', user_input, re.IGNORECASE)
    if "cheque" in text_lower and amount_match:
        raw_amt = amount_match.group(1).replace(",", "")
        if raw_amt.isdigit() and int(raw_amt) > 100:
            extracted["cheque_amount"] = raw_amt

    # 6. Party / Landlord / Employer heuristic extraction
    party_match = re.search(r'\b(?:landlord|tenant|employer|employee|party|against|versus|vs\.?)\s+(?:is\s+)?(mr\.?\s+[a-zA-Z]+|ms\.?\s+[a-zA-Z]+|[A-Z][a-z]+\s+[A-Z][a-z]+)\b', user_input, re.IGNORECASE)
    if party_match:
        extracted["parties"] = party_match.group(1).title()
    elif "landlord" in text_lower or "employer" in text_lower:
        name_match = re.search(r'\b(mr\.?\s+[a-zA-Z]+|ms\.?\s+[a-zA-Z]+)\b', user_input, re.IGNORECASE)
        if name_match:
            extracted["parties"] = name_match.group(1).title()

    return extracted


def _merge_state(old_state: Optional[dict], new_state: dict) -> dict:
    """Safe state merging logic: never overwrite non-empty values with null/empty."""
    if not old_state:
        merged = dict(new_state)
    else:
        merged = dict(old_state)
        for k, v in new_state.items():
            if v is None or v == "" or v == [] or v == "unknown":
                continue
            if k == "collected_fields":
                continue
            
            if isinstance(v, list) and isinstance(merged.get(k), list):
                if k == "missing_information":
                    merged[k] = v
                else:
                    merged[k] = list(set(merged.get(k, []) + v))
            elif isinstance(v, dict) and isinstance(merged.get(k), dict):
                merged[k].update(v)
            else:
                merged[k] = v

    collected_fields = merged.get("collected_fields", {})
    if not isinstance(collected_fields, dict):
        collected_fields = {}

    # Auto-populate collected_fields for all known non-empty attributes
    ignored_keys = ["missing_information", "classification_status", "confidence", "collected_fields", "key_facts", "evidence_available", "asked_questions", "has_immediate_safety_concern"]
    for k, v in merged.items():
        if v is not None and v != "" and v != [] and v != "unknown" and k not in ignored_keys:
            collected_fields[k] = True

    merged["collected_fields"] = collected_fields

    # Category default required fields
    cat = (merged.get("category") or "").upper()
    req_fields = []
    if "RENT" in cat or "LOCKOUT" in cat or merged.get("sub_category") == "lockout":
        req_fields = ["lockout_date", "lockout_time", "property_location", "rent_agreement_exists", "police_informed"]
    elif "CHEQUE" in cat:
        req_fields = ["cheque_amount", "cheque_date", "dishonour_reason", "legal_notice_sent"]
    elif "EMPLOY" in cat:
        req_fields = ["employer_name", "unpaid_period", "salary_amount"]
    elif "CONSUMER" in cat:
        req_fields = ["product_service", "vendor_name", "purchase_amount"]

    # Calculate remaining missing fields
    if req_fields:
        missing = [f for f in req_fields if not collected_fields.get(f)]
        merged["missing_information"] = missing
        if not missing:
            merged["classification_status"] = "COMPLETE"
    elif "missing_information" in merged:
        merged["missing_information"] = [m for m in merged["missing_information"] if not collected_fields.get(m)]
        if not merged["missing_information"]:
            merged["classification_status"] = "COMPLETE"

    return merged


def extract_case_info_real(user_input: str, history: str = "", current_state: dict = None) -> dict:
    """
    Real LLM-based case information extraction with deterministic heuristic overlay.
    Merges new input with existing state safely.
    """
    heuristic_facts = _heuristic_fact_extraction(user_input, current_state)
    client = get_groq_client()
    prev_state_str = json.dumps(current_state or {})
    prompt = (
        f"EXISTING CASE STATE (merge new info into this):\n{prev_state_str}\n\n"
        f"CONVERSATION HISTORY:\n{history or '(none)'}\n\n"
        f"NEW USER INPUT:\n{user_input}\n\n"
        f"Extract updated case information and return as JSON. CRITICAL: Review 'missing_information' from the EXISTING CASE STATE and REMOVE any items that the user has answered in the NEW USER INPUT."
    )

    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": CASE_INTAKE_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=1500,
        )
        content = response.choices[0].message.content
        new_info = json.loads(content)
        merged_llm = _merge_state(current_state, new_info)
        return _merge_state(merged_llm, heuristic_facts)
    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning("Groq rate limited in extract_case_info, falling back to Gemini")
            fallback_prompt = CASE_INTAKE_SYSTEM_PROMPT + "\n\nOUTPUT ONLY VALID JSON.\n\n" + prompt
            raw_text = _gemini_fallback(fallback_prompt, "")
            try:
                match = re.search(r'```(?:json)?\s*([\s\S]*?)```', raw_text)
                if match:
                    raw_text = match.group(1)
                new_info = json.loads(raw_text.strip())
                merged_llm = _merge_state(current_state, new_info)
                return _merge_state(merged_llm, heuristic_facts)
            except Exception as e:
                logger.error(f"Failed to parse Gemini fallback JSON: {e}")
        else:
            logger.error(f"extract_case_info failed: {exc}")

    # Fallback to heuristic extraction if LLM fails
    fallback_state = current_state or {
        "classification_status": "INCOMPLETE",
        "confidence": 0.5,
        "missing_information": ["lockout_date", "lockout_time"],
        "category": "RENTAL_DISPUTE" if "lock" in user_input.lower() else None,
    }
    return _merge_state(fallback_state, heuristic_facts)


def generate_smart_followup(
    missing_information: List[str],
    case_info: dict,
    language: str = "en",
    asked_questions: List[dict] = None
) -> str:
    """Generate a single targeted follow-up question based on what's missing, avoiding generic loops."""
    if not missing_information:
        return "Could you share any additional details about your situation?"

    if asked_questions is None:
        asked_questions = []

    # Pick the target field that hasn't been asked yet
    asked_fields = [q.get("field") if isinstance(q, dict) else None for q in asked_questions]
    target_field = missing_information[0]
    for field in missing_information:
        if field not in asked_fields:
            target_field = field
            break

    # If template exists for target field, use human field question template
    if target_field in FIELD_QUESTION_TEMPLATES:
        question_en = FIELD_QUESTION_TEMPLATES[target_field]
    else:
        # LLM generated question
        client = get_groq_client()
        category = case_info.get("category", "unknown")
        facts_known = case_info.get("key_facts", [])
        asked_texts = [q.get("question") if isinstance(q, dict) else q for q in asked_questions]
        
        prompt = (
            f"Case Type: {category}\n"
            f"Facts already known: {', '.join(facts_known) if facts_known else 'none yet'}\n"
            f"PREVIOUSLY ASKED QUESTIONS: {asked_texts}\n"
            f"Field to ask about: {target_field}\n"
            f"Generate ONE clear, empathetic follow-up question to ask the user for this specific missing field. DO NOT repeat any PREVIOUSLY ASKED QUESTIONS."
        )

        try:
            response = client.chat.completions.create(
                model=PRIMARY_MODEL,
                messages=[
                    {"role": "system", "content": "You are an empathetic Indian Legal AI intake assistant. Output ONLY the single question text."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.5,
                max_tokens=120,
            )
            content = response.choices[0].message.content.strip()
            if content and "details about" not in content.lower():
                question_en = content
            else:
                field_human = target_field.replace('_', ' ')
                question_en = f"Could you clarify the {field_human}?"
        except Exception:
            field_human = target_field.replace('_', ' ')
            question_en = f"Could you clarify the {field_human}?"

    if language and language != "en":
        return translate_text(question_en, language)
    return question_en


