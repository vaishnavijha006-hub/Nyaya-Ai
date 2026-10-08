import json
import logging
import re
from app.services.llm import get_groq_client, PRIMARY_MODEL, _is_rate_limit_error, _gemini_fallback

logger = logging.getLogger(__name__)

INTENT_SYSTEM_PROMPT = """You are a Legal Intent Classifier for Nyaya AI.
Classify the user's message into EXACTLY ONE of the following intents:

1. CASUAL_CHAT: Greetings, pleasantries, casual conversation, thanks, okay, or general small talk (e.g. "hi", "hii", "hello", "good morning", "thanks", "okay", "what's up", "who are you").
2. GENERAL_LEGAL_QUERY: Questions about law, rights, sections, acts, legal definitions, or general concepts without describing a personal dispute (e.g. "What is Section 138 of the Negotiable Instruments Act?").
3. PERSONAL_LEGAL_PROBLEM: Descriptions of an actual conflict, dispute, or legal issue that happened to the user or an identifiable person (e.g. "My landlord locked me out and won't return my deposit").
4. PROCEDURAL_QUERY: Questions asking for procedure, steps, or instructions (e.g. "How do I file an RTI application?", "What is the procedure to file an FIR?").
5. DOCUMENT_QUERY: Requests to draft a document or queries about required documents (e.g. "Draft a legal notice for unpaid dues", "What documents are needed for consumer court?").
6. EMERGENCY_LEGAL_PROBLEM: Statements indicating immediate physical danger, violence, abuse, threats to life or bodily harm.
7. INSUFFICIENT_CONTEXT: Single legal words or ambiguous short inputs where intent cannot be determined without clarification (e.g. "help", "problem", "law?", "rent", "police", "money", "court", "yes", "no").

IMPORTANT: Consider conversation history. If the user previously asked a general question but now describes a personal dispute, classify as PERSONAL_LEGAL_PROBLEM.

Return ONLY JSON:
{
    "intent": "CASUAL_CHAT",
    "confidence": 0.98,
    "reason": "..."
}"""


def is_legal_intent(intent: str) -> bool:
    """Returns True if the intent requires legal modules or RAG search."""
    normalized = (intent or "").upper()
    return normalized in {
        "GENERAL_LEGAL_QUERY", "GENERAL_LEGAL_QUESTION",
        "PERSONAL_LEGAL_PROBLEM",
        "PROCEDURAL_QUERY",
        "DOCUMENT_QUERY", "DOCUMENT_RELATED_QUERY",
        "EMERGENCY_LEGAL_PROBLEM"
    }


def get_greeting_message(language: str = "en") -> str:
    """Returns a friendly, helpful greeting message from Nyaya AI in the user's detected language."""
    lang_lower = (language or "en").lower()
    
    if lang_lower in ["hi", "hindi"]:
        return (
            "नमस्ते! मैं **न्याय AI (Nyaya AI)** हूँ। 👋\n\n"
            "मुझे अपनी कानूनी समस्या के बारे में बताएं या मुझसे कोई कानूनी सवाल पूछें, और मैं आपको अगला कदम तय करने में मदद करूँगा।"
        )
    elif lang_lower in ["hinglish"]:
        return (
            "Namaste! Main **Nyaya AI** hoon. 👋\n\n"
            "Mujhe apni legal problem ke baare mein bataayein ya koi legal question poochhein, main aapko next steps guide karunga."
        )
    else:
        return (
            "Hi! 👋 I'm Nyaya AI. Tell me about your legal problem or ask me a legal question, and I'll help you figure out the next step."
        )


def get_clarification_prompt(user_input: str, language: str = "en") -> str:
    """Generates a polite clarification prompt when user input is ambiguous / INSUFFICIENT_CONTEXT."""
    word = user_input.strip().lower()
    if "rent" in word:
        return "Sure, I'm here to help. Is your question about a rental agreement, unpaid rent, eviction, a security deposit, or something else?"
    elif "police" in word or "fir" in word:
        return "I can assist you with police matters. Are you looking to file an FIR, understand police complaint procedures, or deal with a specific incident?"
    elif "court" in word:
        return "Could you provide a bit more context? Are you asking about court procedures, jurisdiction, legal aid, or an ongoing case?"
    elif "money" in word or "salary" in word:
        return "I can guide you on monetary recovery. Is this regarding unpaid salary, a cheque bounce, loan default, or a deposit refund?"
    else:
        return "Sure, I'm here to help. Are you asking a general legal question, or do you want help with a specific legal problem?"


def _heuristic_classify_intent(user_input: str, history: str = "") -> dict:
    """Deterministic fallback classifier when LLM services rate limit or fail."""
    text_lower = user_input.lower().strip()
    text_clean = re.sub(r'[^\w\s]', '', text_lower).strip()
    words = text_clean.split()
    
    # 0. Casual Chat / Greeting check
    greeting_words = {
        "hi", "hii", "hiii", "hello", "hey", "heyy", "greetings", "good morning",
        "good afternoon", "good evening", "namaste", "namaskar", "who are you",
        "what can you do", "test", "thanks", "thank you", "hi nyaya", "hello nyaya", "hey nyaya",
        "whats up", "whatsup", "what is up", "okay", "ok", "bye", "cool", "great"
    }
    if text_clean in greeting_words or any(text_clean.startswith(g + " ") for g in ["hi", "hii", "hello", "hey", "namaste", "good morning", "good afternoon", "good evening"]):
        if not any(k in text_lower for k in ["my ", "i ", "section", "notice", "law", "court", "landlord", "tenant", "deposit", "evict", "police"]):
            return {"intent": "CASUAL_CHAT", "confidence": 0.98, "reason": "Heuristic casual chat match"}

    # 1. Ambiguous / Insufficient Context check
    ambiguous_set = {"help", "problem", "law", "rent", "police", "court", "money", "urgent", "yes", "no"}
    if text_clean in {"help", "problem", "law", "rent", "police", "court", "money", "urgent", "law?"}:
        return {"intent": "INSUFFICIENT_CONTEXT", "confidence": 0.95, "reason": "Ambiguous single keyword input"}
    if len(words) == 1 and text_clean in ambiguous_set:
        return {"intent": "INSUFFICIENT_CONTEXT", "confidence": 0.90, "reason": "Single ambiguous word"}

    # 2. Emergency check
    emergency_keywords = ["danger", "physically attacking", "violence", "threatened to kill", "immediate danger", "abuse", "threatening me", "threatening", "threatened"]
    if any(k in text_lower for k in emergency_keywords):
        return {"intent": "EMERGENCY_LEGAL_PROBLEM", "confidence": 0.95, "reason": "Heuristic emergency keyword match"}

    # 3. Document assistance indicators
    doc_keywords = ["can you make", "make a legal notice", "draft ", "format ", "sample notice", "what documents", "documents required", "write a notice", "prepare a notice"]
    if any(k in text_lower for k in doc_keywords):
        return {"intent": "DOCUMENT_QUERY", "confidence": 0.90, "reason": "Heuristic document query match"}

    # 4. Procedural query indicators
    proc_keywords = ["how do i file", "how to file", "procedure for", "process of", "steps to", "how do i "]
    if any(k in text_lower for k in proc_keywords):
        return {"intent": "PROCEDURAL_QUERY", "confidence": 0.90, "reason": "Heuristic procedural query match"}

    # 5. General legal question indicators
    general_keywords = ["what is a ", "what is section", "what is ", "what are ", "rights as", "article ", "section ", "can a ", "explain ", "meaning of "]
    if any(k in text_lower for k in general_keywords) and not any(pk in text_lower for pk in ["my ", "me ", "i was ", "locked me"]):
        return {"intent": "GENERAL_LEGAL_QUERY", "confidence": 0.90, "reason": "Heuristic general legal question match"}

    # 6. Personal legal problem indicators
    personal_keywords = [
        "my ", " me ", " me.", " me,", "i was ", "i have ", "locked me", "bounced",
        "salary", "landlord", "employer", "actually", "isn't paying",
        "stole", "refusing", "evicted", "police", "husband", "wife"
    ]
    if any(k in text_lower for k in personal_keywords) or text_lower.startswith("my "):
        return {"intent": "PERSONAL_LEGAL_PROBLEM", "confidence": 0.90, "reason": "Heuristic personal problem keyword match"}

    has_legal_kw = any(k in text_clean for k in ["act", "law", "sec", "fir", "rti", "court", "my", "i", "case", "legal", "notice"])
    if not has_legal_kw and len(words) <= 3:
        return {"intent": "INSUFFICIENT_CONTEXT", "confidence": 0.70, "reason": "Short non-legal query"}

    return {"intent": "CASUAL_CHAT" if (len(text_clean) < 6 or not has_legal_kw) else ("GENERAL_LEGAL_QUERY" if len(text_clean) > 10 else "INSUFFICIENT_CONTEXT"), "confidence": 0.50, "reason": "Heuristic fallback"}


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
            parsed = json.loads(content)
            mapped_intent = parsed.get("intent", "CASUAL_CHAT")
            if mapped_intent == "GREETING":
                parsed["intent"] = "CASUAL_CHAT"
            elif mapped_intent == "GENERAL_LEGAL_QUESTION":
                parsed["intent"] = "GENERAL_LEGAL_QUERY"
            elif mapped_intent == "DOCUMENT_RELATED_QUERY":
                parsed["intent"] = "DOCUMENT_QUERY"
            return parsed
    except Exception as e:
        if _is_rate_limit_error(e):
            raw = _gemini_fallback(INTENT_SYSTEM_PROMPT + "\n\nOUTPUT ONLY VALID JSON.\n\n" + prompt, "")
            try:
                match = re.search(r'```(?:json)?\s*([\s\S]*?)```', raw)
                if match:
                    raw = match.group(1)
                if raw and raw.strip().startswith("{"):
                    parsed = json.loads(raw.strip())
                    mapped_intent = parsed.get("intent", "CASUAL_CHAT")
                    if mapped_intent == "GREETING":
                        parsed["intent"] = "CASUAL_CHAT"
                    elif mapped_intent == "GENERAL_LEGAL_QUESTION":
                        parsed["intent"] = "GENERAL_LEGAL_QUERY"
                    elif mapped_intent == "DOCUMENT_RELATED_QUERY":
                        parsed["intent"] = "DOCUMENT_QUERY"
                    return parsed
            except Exception as e2:
                logger.error(f"Failed to parse Gemini fallback JSON in intent_classifier: {e2}")

    return _heuristic_classify_intent(user_input, history)
