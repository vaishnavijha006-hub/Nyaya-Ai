import os
import functools
import logging

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

logger = logging.getLogger(__name__)

@functools.lru_cache(maxsize=1)
def get_groq_client():
    logger.info("Initializing Groq client...")
    return Groq(api_key=os.getenv("GROQ_API_KEY"))


# ── Language-aware RAG system prompts ────────────────────────────────────────
# Maps language ISO codes to detailed instructions enforcing response in target language
# while safeguarding original English terminology for references/articles.

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
    "ur": "Urdu"
}

def generate_rag_system_prompt(lang_code: str) -> str:
    lang_name = _ISO_LANGUAGE_MAP.get(lang_code, "English")
    
    # Specific instruction modifications for regional context
    extra_instruction = ""
    if lang_code == "hi":
        extra_instruction = " Answer completely in Hindi using natural and formal Hindi, written in Devanagari script. (i.e. explain 'Article 21' in Devanagari as 'अनुच्छेद 21')."
    elif lang_code == "mr":
        extra_instruction = " Answer completely in Marathi using natural and formal Marathi (i.e. explain 'Article 21' as 'कलम 21')."
    
    return (
        f"You are Nyaya AI, an expert AI Legal Assistant specializing in the Constitution of India.\n"
        f"Your absolute target language for the explanation is: {lang_name}.{extra_instruction}\n\n"
        f"STRICT HALLUCINATION & TRANS-LANGUAGE RULES:\n"
        f"1. Answer/explain ONLY using information present in the provided context.\n"
        f"2. If the answer is not found in the context, respond in {lang_name} stating you couldn't find this in the Constitution.\n"
        f"3. Explanations must be generated completely and fluently in {lang_name}.\n"
        f"4. DO NOT translate citation titles, document names ('constitution_of_india.pdf'), article/section metadata numbers, page numbers, or section headings in the sources. Keep them as they are in the context.\n"
        f"5. Under no circumstances should you fabricate legal articles, rules, or citations.\n"
        f"6. Do not claim to be a lawyer or offer personalized legal advisory services."
    )

def generate_general_system_prompt(lang_code: str) -> str:
    lang_name = _ISO_LANGUAGE_MAP.get(lang_code, "English")
    return (
        f"You are Nyaya AI, an AI legal assistant. Provide clear, concise legal information. "
        f"Do not claim to be a lawyer. You must respond completely in {lang_name}."
    )


# ── Public API ────────────────────────────────────────────────────────────────

def ask_llm(question: str, language: str = "en") -> str:
    """
    General-purpose LLM call with no context grounding.
    """
    client = get_groq_client()
    logger.info(f"[llm] ask_llm | lang={language!r} | question={question!r}")
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": generate_general_system_prompt(language)},
                {"role": "user",   "content": question},
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as exc:
        logger.error(f"ask_llm failed: {exc}")
        raise


def ask_llm_rag(question: str, context: str, language: str = "en") -> str:
    """
    RAG-grounded LLM call with dynamic language-aware system prompt.
    """
    client = get_groq_client()
    logger.info(f"[llm] ask_llm_rag | lang={language!r} | question={question!r}")
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": generate_rag_system_prompt(language)},
                {
                    "role": "user",
                    "content": (
                        "Context from the Constitution of India:\n\n"
                        f"{context}\n\n"
                        "---\n\n"
                        f"Question: {question}"
                    ),
                },
            ],
            temperature=0.1,    # Low temp = more deterministic, less hallucination
            max_tokens=1024,
        )
        return response.choices[0].message.content
    except Exception as exc:
        logger.error(f"ask_llm_rag failed: {exc}")
        raise