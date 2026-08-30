import json
import logging
import re
from app.services.llm import get_groq_client, PRIMARY_MODEL, _is_rate_limit_error, _gemini_fallback

logger = logging.getLogger(__name__)

INTENT_SYSTEM_PROMPT = """You are a Legal Intent Classifier for Nyaya AI.
Classify the user's message into one of the following intents:
GENERAL_LEGAL_QUESTION: User asks about law, rights, procedures, sections, forms, processes, or legal concepts without describing a personal dispute that requires investigation (e.g. "What is Section 138?").
PERSONAL_LEGAL_PROBLEM: User describes something that happened to them or another identifiable person, an ongoing conflict, dispute, or received a legal notice (e.g. "My landlord locked me out").
DOCUMENT_RELATED_QUERY: User asks to draft a document (e.g. "Draft a legal notice", "Write an FIR") or asks what documents they need.
PROCEDURAL_QUERY: User specifically asks for a procedure (e.g. "How do I file an RTI?", "What is the procedure for an FIR?").
EMERGENCY_LEGAL_PROBLEM: User indicates immediate danger, threats, violence, ongoing abuse.
UNKNOWN: Unrelated or greeting.

IMPORTANT: Consider the conversation history. If the user previously asked a general question but now describes a personal situation, classify as PERSONAL_LEGAL_PROBLEM.
If they just answer a follow-up question (like a date or amount) about their personal problem, classify as PERSONAL_LEGAL_PROBLEM.

Return ONLY JSON:
{
    "intent": "GENERAL_LEGAL_QUESTION",
    "confidence": 0.95,
    "reason": "..."
}"""


def _heuristic_classify_intent(user_input: str, history: str = "") -> dict:
    """Deterministic fallback classifier when LLM services rate limit or fail."""
    text_lower = user_input.lower().strip()
    
    # 1. Emergency check
    emergency_keywords = ["danger", "physically attacking", "violence", "threatened to kill", "immediate danger", "abuse", "threatening me", "threatening", "threatened"]
    if any(k in text_lower for k in emergency_keywords):
        return {"intent": "EMERGENCY_LEGAL_PROBLEM", "confidence": 0.95, "reason": "Heuristic emergency keyword match"}

    # 2. Document assistance indicators (e.g., "Can you make a legal notice?", "Draft a legal notice")
    doc_keywords = ["can you make", "make a legal notice", "draft ", "format ", "sample notice", "what documents", "documents required", "write a notice", "prepare a notice"]
    if any(k in text_lower for k in doc_keywords):
        return {"intent": "DOCUMENT_RELATED_QUERY", "confidence": 0.90, "reason": "Heuristic document query match"}

    # 3. Procedural query indicators (e.g., "How do I file a consumer complaint?", "Procedure for FIR")
    proc_keywords = ["how do i file", "how to file", "procedure for", "process of", "steps to", "how do i "]
    if any(k in text_lower for k in proc_keywords):
        return {"intent": "PROCEDURAL_QUERY", "confidence": 0.90, "reason": "Heuristic procedural query match"}

    # 4. General legal question indicators (e.g., "What is a rent agreement?", "What is Section 138?")
    general_keywords = ["what is a ", "what is ", "what are ", "rights as", "article ", "section ", "can a ", "explain ", "meaning of "]
    if any(k in text_lower for k in general_keywords) and not any(pk in text_lower for pk in ["my ", "me ", "i was ", "locked me"]):
        return {"intent": "GENERAL_LEGAL_QUESTION", "confidence": 0.90, "reason": "Heuristic general legal question match"}

    # 5. Personal legal problem indicators (e.g., "My landlord locked me out.")
    personal_keywords = [
        "my ", " me ", " me.", " me,", "i was ", "i have ", "locked me", "bounced",
        "salary", "landlord", "employer", "actually", "isn't paying",
        "stole", "refusing", "evicted", "police", "husband", "wife"
    ]
    if any(k in text_lower for k in personal_keywords) or text_lower.startswith("my "):
        return {"intent": "PERSONAL_LEGAL_PROBLEM", "confidence": 0.90, "reason": "Heuristic personal problem keyword match"}

    return {"intent": "GENERAL_LEGAL_QUESTION" if len(text_lower) > 10 else "UNKNOWN", "confidence": 0.50, "reason": "Heuristic fallback"}



def classify_intent(user_input: str, history: str = "") -> dict:
    client = get_groq_client()
    prompt = f"HISTORY:\n{history}\n\nUSER INPUT:\n{user_input}\n\nClassify intent."
    
    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": INTENT_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
            max_tokens=150
        )
        content = response.choices[0].message.content
        if content and content.strip().startswith("{"):
            return json.loads(content)
    except Exception as e:
        if _is_rate_limit_error(e):
            raw = _gemini_fallback(INTENT_SYSTEM_PROMPT + "\n\nOUTPUT ONLY VALID JSON.\n\n" + prompt, "")
            try:
                match = re.search(r'```(?:json)?\s*([\s\S]*?)```', raw)
                if match:
                    raw = match.group(1)
                if raw and raw.strip().startswith("{"):
                    return json.loads(raw.strip())
            except Exception as e2:
                logger.error(f"Failed to parse Gemini fallback JSON in intent_classifier: {e2}")

    return _heuristic_classify_intent(user_input, history)

