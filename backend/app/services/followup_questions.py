import logging
from app.services.llm import get_groq_client, PRIMARY_MODEL, _is_rate_limit_error, _gemini_fallback
from app.services.translator import translate_text

logger = logging.getLogger(__name__)

FOLLOWUP_SYSTEM_PROMPT = """You are a helpful and empathetic Legal AI Assistant. 
The user has provided some information about a legal issue, but critical details are missing.
Your task is to generate ONE natural, conversational follow-up question to ask the user for the missing information.
Determine if the missing information is BLOCKING (absolutely necessary to proceed) or ENHANCEMENT (helpful but not strictly required).
Focus on the most important missing piece of information first.
Output the question in a friendly, supportive tone. Do not overwhelm the user with multiple questions at once.
"""

def generate_followup_question(missing_information: list, current_state: dict, language: str = "en") -> str:
    if not missing_information:
        return "Can you tell me more about your situation?"
    
    client = get_groq_client()
    missing_str = ", ".join(missing_information)
    
    prompt = f"Current Case State:\n{current_state}\n\nMissing Information:\n{missing_str}\n\nGenerate ONE natural follow-up question to ask the user to provide this missing information."
    
    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": FOLLOWUP_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=150
        )
        question_en = response.choices[0].message.content.strip()
    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning(f"Groq rate limited in generate_followup_question, falling back to Gemini")
            question_en = _gemini_fallback(FOLLOWUP_SYSTEM_PROMPT, prompt).strip()
        else:
            logger.error(f"generate_followup_question failed: {exc}")
            question_en = f"Could you please provide more details about: {missing_information[0]}?"
            
    # Translate if necessary
    if language != "en":
        return translate_text(question_en, language)
    
    return question_en
