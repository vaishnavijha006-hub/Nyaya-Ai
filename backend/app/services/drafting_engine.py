import json
import logging
from app.services.llm import get_groq_client, PRIMARY_MODEL, _is_rate_limit_error, _gemini_fallback
from fastapi.concurrency import run_in_threadpool

logger = logging.getLogger(__name__)

DRAFTING_SYSTEM_PROMPT = """You are an expert Indian Legal AI Drafting Engine.
Your task is to either:
1. Generate the requested legal document (like a Legal Notice, FIR, Complaint) if you have all the necessary information.
2. Ask the user for the SPECIFIC missing information needed to draft the document.

Do NOT say "Could you provide more details about the incident?". Ask for specific fields (e.g., "Please provide the sender's name, recipient's name, and amount due").

If the user request is just "Draft a legal notice for non-payment", output a request for the required fields.
Make it conversational but professional.

Return ONLY JSON format:
{
  "can_draft": false,
  "missing_fields": ["sender name", "recipient name", "amount due", "date of default", "reason for dues"],
  "message_to_user": "I can help you draft the legal notice. Please provide: 1. Sender's name..."
}
OR if they provided everything:
{
  "can_draft": true,
  "draft_content": "[The actual legal draft text...]",
  "message_to_user": "Here is the draft for your legal notice. [draft included]"
}
"""

async def run_drafting_engine(question: str, language: str = "en", history_str: str = "") -> str:
    client = get_groq_client()
    prompt = f"HISTORY:\n{history_str}\n\nUSER REQUEST:\n{question}\n\nDraft the document or ask for required fields."

    try:
        response = await run_in_threadpool(
            client.chat.completions.create,
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": DRAFTING_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=1500,
        )
        result = json.loads(response.choices[0].message.content)
    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning("Groq rate limited in drafting, falling back to Gemini")
            fallback_prompt = DRAFTING_SYSTEM_PROMPT + "\n\nOUTPUT ONLY VALID JSON.\n\n" + prompt
            raw = await run_in_threadpool(_gemini_fallback, fallback_prompt, "")
            raw = raw.strip()
            try:
                if raw.startswith("`json"): raw = raw[7:-3]
                elif raw.startswith("`"): raw = raw[3:-3]
                result = json.loads(raw)
            except Exception as e:
                logger.error(f"Failed to parse Gemini fallback JSON in drafting: {e}")
                return "I apologize, but I'm unable to process the drafting request right now."
        else:
            logger.error(f"drafting failed: {exc}")
            return "I apologize, but I'm unable to process the drafting request right now."
            
    if result.get("can_draft") and result.get("draft_content"):
        return f"Here is the draft you requested:\n\n{result.get('draft_content')}"
    else:
        return result.get("message_to_user", "Could you provide more specific details for the draft?")
