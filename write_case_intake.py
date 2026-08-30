import json

content = '''import json
import logging
from typing import List, Dict, Any
from app.services.llm import get_groq_client, PRIMARY_MODEL, _is_rate_limit_error, _gemini_fallback
from app.services.translator import translate_text

logger = logging.getLogger(__name__)

CASE_INTAKE_SYSTEM_PROMPT = """You are an expert Indian Legal AI intake assistant.
Your task is to extract structured case information from a conversation and determine
what critical information is still missing to fully understand the legal case.

You must return ONLY a valid JSON object with these exact fields:
{
  "category": "One of: tenant_landlord, domestic_family, consumer_complaint, employment_dispute, property_dispute, cybercrime, fraud, contract_dispute, harassment, criminal_complaint, government_service, rti, environmental_public, accident_compensation, debt_financial, other",
  "sub_category": "Specific sub-type of the case",
  "issue": "A brief summary of the core legal issue",
  "parties": "Description of involved parties (e.g., Tenant vs Landlord)",
  "location": "City and state if mentioned, else null",
  "case_stage": "One of: pre_litigation, notice_sent, fir_filed, trial, appeal, or null",
  "urgency": "high, medium, or low",
  "desired_outcome": "What the user wants to achieve",
  "key_facts": ["List of specific facts established so far"],
  "evidence_available": ["List of evidence mentioned by user"],
  "missing_information": ["List of CRITICAL missing details needed — be specific to the case type"],
  "collected_fields": {"field_name": true},
  "has_immediate_safety_concern": false,
  "documents_likely_needed": ["Preliminary list of documents that will be relevant based on case type"],
  "confidence": 0.0,
  "classification_status": "COMPLETE if enough info exists to give legal advice, INCOMPLETE otherwise"
}

Rules:
- CRITICAL: Never overwrite already collected information with empty/null values. Keep all facts and evidence from the EXISTING CASE STATE.
- Normalize natural language answers (e.g., "18 August 2026 at 11:20 PM" -> mark incident_datetime as true, add fact "Incident occurred on 2026-08-18 23:20").
- Use collected_fields to track which specific facts have been gathered (e.g. incident_date, time, location, etc.).
- If collected_fields shows a fact is true, you MUST NOT ask for it again and it MUST NOT be in missing_information.
- Output ONLY valid JSON. No explanations outside the JSON.
"""

def extract_case_info_real(user_input: str, history: str = "", current_state: dict = None) -> dict:
    """
    Real LLM-based case information extraction.
    Merges new input with existing state.
    Falls back gracefully on LLM errors.
    """
    client = get_groq_client()
    prev_state_str = json.dumps(current_state or {})
    prompt = (
        f"EXISTING CASE STATE (merge new info into this):\\n{prev_state_str}\\n\\n"
        f"CONVERSATION HISTORY:\\n{history or '(none)'}\\n\\n"
        f"NEW USER INPUT:\\n{user_input}\\n\\n"
        f"Extract updated case information and return as JSON. CRITICAL: Review 'missing_information' from the EXISTING CASE STATE and REMOVE any items that the user has answered in the NEW USER INPUT."
    )

    def _merge_state(old_state, new_state):
        if not old_state:
            return new_state
        merged = dict(old_state)
        for k, v in new_state.items():
            if v is None or v == "" or v == []:
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
        return merged

    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": CASE_INTAKE_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=800,
        )
        content = response.choices[0].message.content
        new_info = json.loads(content)
        return _merge_state(current_state, new_info)
    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning("Groq rate limited in extract_case_info, falling back to Gemini")
            fallback_prompt = CASE_INTAKE_SYSTEM_PROMPT + "\\n\\nOUTPUT ONLY VALID JSON.\\n\\n" + prompt
            raw_text = _gemini_fallback(fallback_prompt, "")
            try:
                cleaned = raw_text.strip()
                if cleaned.startswith("json"):
                    cleaned = cleaned[7:-3]
                elif cleaned.startswith(""):
                    cleaned = cleaned[3:-3]
                new_info = json.loads(cleaned)
                return _merge_state(current_state, new_info)
            except Exception as e:
                logger.error(f"Failed to parse Gemini fallback JSON: {e}")
        else:
            logger.error(f"extract_case_info failed: {exc}")

    return current_state or {
        "classification_status": "INCOMPLETE",
        "confidence": 0.0,
        "missing_information": ["Please describe your legal problem in more detail."],
        "category": None,
    }

FOLLOWUP_SYSTEM_PROMPT = """You are an empathetic Indian Legal AI intake assistant.
The user has described a legal problem. You need ONE specific follow-up question
to gather the most important missing information.

Rules:
- Ask exactly ONE clear, concise question.
- Adapt the question to the specific case type and facts already known.
- Be empathetic but professional.
- Do not number the question.
- Do not explain why you are asking.
- Output ONLY the question text, nothing else.
- DO NOT ask any question that is semantically similar to the PREVIOUSLY ASKED QUESTIONS.
"""

def generate_smart_followup(missing_information: List[str], case_info: dict, language: str = "en", asked_questions: List[str] = None) -> str:
    """Generate a single targeted follow-up question based on what's missing."""
    if not missing_information:
        return "Could you share any additional details about your situation?"

    if asked_questions is None:
        asked_questions = []

    client = get_groq_client()
    category = case_info.get("category", "legal")
    facts_known = case_info.get("key_facts", [])
    prompt = (
        f"Case Type: {category}\\n"
        f"Sub-Category: {case_info.get('sub_category', 'unknown')}\\n"
        f"Facts already known: {', '.join(facts_known) if facts_known else 'none yet'}\\n"
        f"PREVIOUSLY ASKED QUESTIONS: {asked_questions}\\n"
        f"Most important missing piece: {missing_information[0]}\\n"
        f"All missing: {', '.join(missing_information[:3])}\\n\\n"
        f"Generate ONE empathetic follow-up question to ask the user for the missing information. DO NOT repeat any of the PREVIOUSLY ASKED QUESTIONS."
    )

    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": FOLLOWUP_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.5,
            max_tokens=120,
        )
        question_en = response.choices[0].message.content.strip()
    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning("Groq rate limited in generate_smart_followup, falling back to Gemini")
            question_en = _gemini_fallback(FOLLOWUP_SYSTEM_PROMPT, prompt).strip()
        else:
            logger.error(f"generate_smart_followup failed: {exc}")
            question_en = f"Could you provide more information about: {missing_information[0]}?"

    if language and language != "en":
        return translate_text(question_en, language)
    return question_en
'''

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\backend\app\services\case_intake.py', 'w', encoding='utf-8') as f:
    f.write(content)
