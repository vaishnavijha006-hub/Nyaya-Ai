import os
import functools
import logging

from dotenv import load_dotenv
from groq import Groq

try:
    from google import genai as google_genai
    from google.genai import types as genai_types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

load_dotenv()

logger = logging.getLogger(__name__)

# Primary model: llama-3.1-8b-instant has 6M tokens/day free (60x more than 70b model)
PRIMARY_MODEL = "llama-3.1-8b-instant"

@functools.lru_cache(maxsize=1)
def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.error("GROQ_API_KEY environment variable is missing or empty.")
        raise RuntimeError("GROQ_API_KEY environment variable is not configured on the backend server.")
    logger.info("Initializing Groq client with configured API key...")
    return Groq(api_key=api_key)


def _is_rate_limit_error(exc: Exception) -> bool:
    """Check if exception is a Groq rate limit error."""
    msg = str(exc).lower()
    return "rate_limit" in msg or "429" in msg or "rate limit" in msg


def _gemini_fallback_stream(system_prompt: str, user_prompt: str):
    """Fallback to Google Gemini Flash when Groq is rate limited."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not GEMINI_AVAILABLE or not gemini_key:
        yield "\n[Service temporarily busy. Please try again in a few minutes.]"
        return
    try:
        client = google_genai.Client(api_key=gemini_key)
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        response = client.models.generate_content_stream(
            model="gemini-2.0-flash",
            contents=full_prompt,
        )
        for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        logger.error(f"Gemini fallback failed: {e}")
        yield "\n[Service temporarily busy. Please try again in a few minutes.]"


def _gemini_fallback(system_prompt: str, user_prompt: str) -> str:
    """Non-streaming Gemini fallback."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not GEMINI_AVAILABLE or not gemini_key:
        return "Service temporarily busy. Please try again in a few minutes."
    try:
        client = google_genai.Client(api_key=gemini_key)
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt,
        )
        return response.text
    except Exception as e:
        logger.error(f"Gemini fallback failed: {e}")
        return "Service temporarily busy. Please try again in a few minutes."


_ISO_LANGUAGE_MAP = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "ta": "Tamil",
    "te": "Telugu",
    "bn": "Bengali",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "ur": "Urdu",
    "hinglish": "Hinglish"
}

ALLOWED_AUDIENCES = {"default", "student", "lawyer", "upsc", "child"}

_AUDIENCE_PROMPTS = {
    "default": (
        "Use a balanced legal explanation suitable for a general reader. "
        "Do not alter legal facts, citations, or source references."
    ),
    "student": (
        "Explain with educational clarity. Define legal terms in plain language, "
        "connect the answer to constitutional concepts where relevant, and keep the "
        "learning path clear. Do not alter legal facts, citations, or source references."
    ),
    "lawyer": (
        "Use technical legal analysis and precise legal terminology. Discuss statutory "
        "interpretation and precedents where the provided context supports it. Avoid "
        "oversimplification. Do not alter legal facts, citations, or source references."
    ),
    "upsc": (
        "Explain from a constitutional and governance perspective. Mention historical "
        "significance, constitutional philosophy, and exam-relevant points where the "
        "provided context supports them. Do not alter legal facts, citations, or source references."
    ),
    "child": (
        "Explain in very simple English with short sentences. Avoid legal jargon and use "
        "everyday examples where helpful. Do not alter legal facts, citations, or source references."
    ),
}


def normalize_audience(audience: str = "default") -> str:
    normalized = (audience or "default").strip().lower()
    if normalized not in ALLOWED_AUDIENCES:
        raise ValueError(f"Unsupported audience: {audience}")
    return normalized


def generate_audience_prompt(audience: str = "default") -> str:
    return _AUDIENCE_PROMPTS[normalize_audience(audience)]


def generate_rag_system_prompt(lang_code: str) -> str:
    lang_name = _ISO_LANGUAGE_MAP.get(lang_code, "English")
    
    extra_instruction = f" You MUST respond and write your entire explanation completely in {lang_name}."
    if lang_code == "hi":
        extra_instruction = " You MUST answer completely in Hindi using formal and natural Hindi, written entirely in Devanagari script (देवनागरी लिपि)."
    elif lang_code == "mr":
        extra_instruction = " You MUST answer completely in Marathi using formal and natural Marathi, written in Devanagari script."
    elif lang_code == "ta":
        extra_instruction = " You MUST answer completely in Tamil (தமிழ்)."
    elif lang_code == "te":
        extra_instruction = " You MUST answer completely in Telugu (తెలుగు)."
    elif lang_code == "bn":
        extra_instruction = " You MUST answer completely in Bengali (বাংলা)."
    elif lang_code == "gu":
        extra_instruction = " You MUST answer completely in Gujarati (ગુજરાતી)."
    elif lang_code == "kn":
        extra_instruction = " You MUST answer completely in Kannada (ಕನ್ನಡ)."
    elif lang_code == "ml":
        extra_instruction = " You MUST answer completely in Malayalam (മലയാളം)."
    elif lang_code == "pa":
        extra_instruction = " You MUST answer completely in Punjabi (ਪੰਜਾਬੀ)."
    elif lang_code == "ur":
        extra_instruction = " You MUST answer completely in Urdu (اردو)."
    elif lang_code == "hinglish":
        extra_instruction = " You MUST answer completely in Hinglish (Hindi words written using the Latin script/alphabet, e.g., 'Aapka kanooni adhikar Article 21 ke tehat...')."
    
    return (
        f"You are Nyaya AI, an expert AI Legal Assistant specializing in Indian Law, the Constitution, and Landmark Supreme Court Judgments.\n"
        f"CRITICAL LANGUAGE INSTRUCTION: {extra_instruction}\n"
        f"Even if the question is asked in English, because the user selected {lang_name}, translate and explain everything into {lang_name}.\n\n"
        f"RESPONSE STRUCTURE REQUIREMENT:\n"
        f"Whenever applicable based on retrieved sources, organize your legal answer into the following 4 sections (translate section headers to {lang_name} if appropriate, or keep them clear):\n"
        f"1. Relevant Act / Statutory Provisions\n"
        f"2. Relevant Judgment / Landmark Precedents\n"
        f"3. Comprehensive Legal Explanation\n"
        f"4. Practical Meaning & Real-World Impact\n\n"
        f"STRICT HALLUCINATION & TRANS-LANGUAGE RULES:\n"
        f"1. Answer/explain ONLY using information present in the provided context.\n"
        f"2. If sufficient context or legal evidence is unavailable in the provided context, DO NOT fabricate legal information. Respond in {lang_name} stating strictly that not enough legal evidence was found.\n"
        f"3. Explanations must be generated completely and fluently in {lang_name}.\n"
        f"4. DO NOT translate specific statute names, case citations (e.g. 'K.S. Puttaswamy v. Union of India'), section/article numbers (e.g. 'Article 21'), or page numbers. Keep specific legal identifiers in their standard citation form.\n"
        f"5. Under no circumstances should you fabricate legal articles, rules, section numbers, or court judgements.\n"
        f"6. Do not claim to be a lawyer or offer personalized legal advisory services."
    )


def generate_general_system_prompt(lang_code: str) -> str:
    lang_name = _ISO_LANGUAGE_MAP.get(lang_code, "English")
    return (
        f"You are Nyaya AI, an AI legal assistant specializing in Indian Statutes and Landmark Judgments. "
        f"Do not claim to be a lawyer. You must respond completely in {lang_name}."
    )


def ask_llm(question: str, language: str = "en") -> str:
    client = get_groq_client()
    logger.info(f"[llm] ask_llm | lang={language!r} | question={question!r}")
    sys_prompt = generate_general_system_prompt(language)
    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user",   "content": question},
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning(f"Groq rate limited, falling back to Gemini: {exc}")
            return _gemini_fallback(sys_prompt, question)
        logger.error(f"ask_llm failed: {exc}")
        raise


def ask_llm_rag(question: str, context: str, language: str = "en", history: str = "", audience: str = "default") -> str:
    client = get_groq_client()
    normalized_audience = normalize_audience(audience)
    logger.info(f"[llm] ask_llm_rag | lang={language!r} | audience={normalized_audience!r} | question={question!r}")
    
    user_prompt = (
        f"Audience Prompt:\n{generate_audience_prompt(normalized_audience)}\n\n"
        f"Context from Legal Documents & Judgments:\n\n{context}\n\n"
    )
    if history:
        user_prompt += f"Previous Conversation History:\n{history}\n\n"
        
    user_prompt += f"---\n\nQuestion: {question}"

    sys_prompt = generate_rag_system_prompt(language)
    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=1024,
        )
        return response.choices[0].message.content
    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning(f"Groq rate limited, falling back to Gemini: {exc}")
            return _gemini_fallback(sys_prompt, user_prompt)
        logger.error(f"ask_llm_rag failed: {exc}")
        raise


def ask_llm_rag_stream(question: str, context: str, language: str = "en", history: str = "", audience: str = "default"):
    client = get_groq_client()
    normalized_audience = normalize_audience(audience)
    logger.info(f"[llm] ask_llm_rag_stream | lang={language!r} | audience={normalized_audience!r} | question={question!r}")
    
    user_prompt = (
        f"Audience Prompt:\n{generate_audience_prompt(normalized_audience)}\n\n"
        f"Context from Legal Documents & Judgments:\n\n{context}\n\n"
    )
    if history:
        user_prompt += f"Previous Conversation History:\n{history}\n\n"
    user_prompt += f"---\n\nQuestion: {question}"

    sys_prompt = generate_rag_system_prompt(language)
    try:
        stream = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=1024,
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning(f"Groq rate limited on stream, falling back to Gemini: {exc}")
            yield from _gemini_fallback_stream(sys_prompt, user_prompt)
        else:
            logger.error(f"ask_llm_rag_stream failed: {exc}")
            yield f"\n[Error: {str(exc)}]"
