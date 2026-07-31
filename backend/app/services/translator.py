"""
translator.py — Multilingual Translation Service for Nyaya AI.

Handles:
1. Translating non-English user queries to English internally for accurate vector/BM25 retrieval against English legal documents.
2. Translating final LLM legal answers into the target user-selected language (Hindi, Marathi, Tamil, Telugu, etc.) with strict fallback handling.
"""

import logging
from app.services.llm import get_groq_client, PRIMARY_MODEL, _is_rate_limit_error, _gemini_fallback

logger = logging.getLogger(__name__)

LANGUAGE_PROMPTS = {
    "hi": "Hindi (हिंदी)",
    "mr": "Marathi (मराठी)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "bn": "Bengali (বাংলা)",
    "gu": "Gujarati (ગુજરાતી)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "ml": "Malayalam (മലയാളം)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
    "ur": "Urdu (اردو)",
    "hinglish": "Hinglish (Hindi written in Roman/Latin script)",
}

def translate_query_to_english(text: str, source_lang: str) -> str:
    """Translate user query to English for accurate RAG vector search if non-English."""
    if source_lang == "en" or not text.strip():
        return text

    logger.info(f"[translator] Translating user query from '{source_lang}' to English: {text!r}")
    sys_prompt = "You are a professional legal translator. Translate the given text into clean, clear English suitable for legal document search. Output ONLY the English translation without explanation or extra text."
    
    try:
        client = get_groq_client()
        res = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": text},
            ],
            temperature=0.0,
            max_tokens=300,
        )
        translated = res.choices[0].message.content.strip()
        logger.info(f"[translator] Translated query: {translated!r}")
        return translated if translated else text
    except Exception as exc:
        logger.warning(f"[translator] Query translation to English failed: {exc}. Using raw query.")
        return text


def translate_text(text: str, target_lang: str) -> str:
    """
    Translate final legal answer into target_lang with strict error handling.
    If target_lang is 'en', returns text as-is.
    """
    if target_lang == "en" or not text.strip():
        return text

    lang_label = LANGUAGE_PROMPTS.get(target_lang, "Hindi (हिंदी)")
    logger.info(f"[translator] Translating final response into '{target_lang}' ({lang_label}). Text length: {len(text)}")

    sys_prompt = (
        f"You are a professional legal translator for Indian Citizens.\n"
        f"CRITICAL RULE: Translate the provided legal explanation completely and accurately into {lang_label}.\n"
        f"RULES:\n"
        f"1. Produce the ENTIRE output strictly in {lang_label}.\n"
        f"2. Keep statutory proper names and citations (e.g. 'Article 21', 'Consumer Protection Act', 'K.S. Puttaswamy v. Union of India') in their original clear citation format.\n"
        f"3. Do NOT add meta commentary like 'Here is the translation:' — return ONLY the final translated response."
    )

    try:
        client = get_groq_client()
        res = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": text},
            ],
            temperature=0.1,
            max_tokens=1500,
        )
        translated = res.choices[0].message.content.strip()
        if not translated:
            raise RuntimeError("Empty response received from translation service.")
        
        # ── Language Validation Step ──────────────────────────────────────────
        # Check if target is Devanagari script (hi, mr) and result still contains heavy English paragraphs
        if target_lang in ("hi", "mr"):
            import re
            # Extract pure word tokens excluding citations/punctuation
            words = re.findall(r'[a-zA-Z]{4,}', translated)
            # Filter out standard proper citations like Article, Section, Act, Court
            allowed_citations = {"article", "section", "court", "union", "india", "state", "versus", "judgement", "v", "act"}
            english_leaks = [w for w in words if w.lower() not in allowed_citations]
            
            if len(english_leaks) > 5:
                logger.warning(f"[translator] Validation notice: Detected {len(english_leaks)} English leaks in {target_lang} output ({english_leaks[:3]}). Re-enforcing Devanagari translation...")
                strict_sys = (
                    f"You are a strict legal translator. Convert the following text 100% into Devanagari script ({lang_label}). "
                    f"Zero English sentences allowed. Every single paragraph, heading, and explanation MUST be written in Devanagari script."
                )
                re_res = client.chat.completions.create(
                    model=PRIMARY_MODEL,
                    messages=[
                        {"role": "system", "content": strict_sys},
                        {"role": "user", "content": translated},
                    ],
                    temperature=0.0,
                    max_tokens=1500,
                )
                if re_res.choices[0].message.content:
                    translated = re_res.choices[0].message.content.strip()

        logger.info(f"[translator] Translation complete into {target_lang}. Result length: {len(translated)}")
        return translated
    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning(f"[translator] Groq rate limited during translation, attempting Gemini fallback: {exc}")
            fallback_res = _gemini_fallback(sys_prompt, text)
            if fallback_res and not fallback_res.startswith("Service temporarily busy"):
                return fallback_res
        
        logger.error(f"[translator] Translation failed for language '{target_lang}': {exc}")
        # Explicit error message as requested — NEVER silently return English
        return "उत्तर का अनुवाद करने में असमर्थ। कृपया पुनः प्रयास करें।"
