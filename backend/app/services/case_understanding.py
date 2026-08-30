import json
import logging
from app.services.llm import get_groq_client, PRIMARY_MODEL, _is_rate_limit_error, _gemini_fallback

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert Indian Legal AI Assistant. Your task is to extract structured case information from the user's input and conversation history.
You must return a valid JSON object with the following fields:
{
    "category": "String (e.g., Criminal, Civil, Family, Corporate, Property) or null if unknown",
    "sub_category": "String (e.g., Divorce, Theft, Breach of Contract) or null if unknown",
    "issue": "A brief summary of the core legal issue",
    "parties": "Description of involved parties (e.g., Husband vs Wife, Tenant vs Landlord) or null",
    "location": "Jurisdiction or city/state if mentioned, else null",
    "case_stage": "e.g., Pre-litigation, FIR filed, Trial, Appeal, or null",
    "urgency": "High, Medium, Low, or null",
    "desired_outcome": "What the user wants to achieve, or null",
    "evidence_available": "List of evidence mentioned, or null",
    "missing_information": ["List of critical missing details needed to properly classify or understand the case"],
    "confidence": 0.0 to 1.0 (float representing your confidence in this extraction),
    "classification_status": "COMPLETE" if enough info is present to provide legal advice, "INCOMPLETE" if critical details are missing
}
Ensure the output is strictly valid JSON.
"""

def extract_case_info(user_input: str, history: str = "", current_state: dict = None) -> dict:
    """
    Delegates to the new case_intake module for real LLM-based extraction.
    Kept here for backward compatibility with other callers.
    """
    from app.services.case_intake import extract_case_info_real
    return extract_case_info_real(user_input, history, current_state)
