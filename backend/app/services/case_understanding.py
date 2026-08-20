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
    client = get_groq_client()
    
    prompt = f"Previous State:\n{json.dumps(current_state or {})}\n\nHistory:\n{history}\n\nUser Input:\n{user_input}\n\nPlease merge the new input with the previous state and extract the case information as JSON."
    
    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning(f"Groq rate limited in extract_case_info, falling back to Gemini")
            # Gemini fallback doesn't support response_format strict json easily without specific prompt tweaks, 
            # but we can try basic string extraction
            fallback_prompt = SYSTEM_PROMPT + "\n\nOUTPUT ONLY VALID JSON.\n\n" + prompt
            raw_text = _gemini_fallback(fallback_prompt, "")
            # attempt to parse JSON from raw_text
            try:
                # Basic cleanup
                cleaned = raw_text.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:-3]
                elif cleaned.startswith("```"):
                    cleaned = cleaned[3:-3]
                return json.loads(cleaned)
            except Exception as e:
                logger.error(f"Failed to parse Gemini fallback JSON: {e}")
        else:
            logger.error(f"extract_case_info failed: {exc}")
        
        # Return fallback state if all fails
        return current_state or {
            "classification_status": "INCOMPLETE", 
            "confidence": 0.0,
            "missing_information": []
        }
