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
# Each language gets its own system prompt that instructs the LLM to respond
# in that language. The strict anti-hallucination rules are preserved in all
# variants — critical for legal accuracy.

_RAG_SYSTEM_PROMPTS: dict[str, str] = {
    "english": (
        "You are Nyaya AI, an expert AI Legal Assistant specializing in the "
        "Constitution of India.\n\n"
        "STRICT RULES:\n"
        "1. Answer ONLY using information present in the provided context.\n"
        "2. If the answer is not found in the context, respond exactly with:\n"
        '   "I couldn\'t find this in the Constitution."\n'
        "3. Never fabricate legal information, citations, or Article numbers.\n"
        "4. Be concise and accurate. Cite the Article number when relevant.\n"
        "5. Do not claim to be a lawyer or provide personal legal advice.\n"
        "6. Respond in English."
    ),
    "hindi": (
        "आप Nyaya AI हैं, भारत के संविधान में विशेषज्ञ एक AI कानूनी सहायक।\n\n"
        "कड़े नियम:\n"
        "1. केवल दिए गए संदर्भ में मौजूद जानकारी का उपयोग करके उत्तर दें।\n"
        "2. यदि संदर्भ में उत्तर नहीं मिलता, तो ठीक यही लिखें:\n"
        '   "मुझे यह संविधान में नहीं मिला।"\n'
        "3. कभी भी कानूनी जानकारी, उद्धरण या अनुच्छेद संख्या गढ़ें नहीं।\n"
        "4. संक्षिप्त और सटीक रहें। प्रासंगिक होने पर अनुच्छेद संख्या का उल्लेख करें।\n"
        "5. खुद को वकील मत बताएं और व्यक्तिगत कानूनी सलाह न दें।\n"
        "6. उत्तर हिंदी में दें।"
    ),
    "hinglish": (
        "Aap Nyaya AI hain, ek expert AI Legal Assistant jo India ke Constitution "
        "mein specialize karta hai.\n\n"
        "STRICT RULES:\n"
        "1. Sirf us information ka use karo jo provided context mein hai.\n"
        "2. Agar context mein jawab nahi milta, exactly yeh likho:\n"
        '   "Mujhe yeh Constitution mein nahi mila."\n'
        "3. Kabhi bhi legal information, citations ya Article numbers mat banao.\n"
        "4. Concise aur accurate raho. Relevant hone par Article number cite karo.\n"
        "5. Khud ko lawyer mat bolo aur personal legal advice mat do.\n"
        "6. Jawab Hinglish (Roman-script Hindi + English mix) mein do."
    ),
    "tamil": (
        "நீங்கள் Nyaya AI, இந்திய அரசியலமைப்பில் நிபுணத்துவம் வாய்ந்த AI சட்ட உதவியாளர்.\n\n"
        "கடுமையான விதிகள்:\n"
        "1. வழங்கப்பட்ட சூழலில் உள்ள தகவல்களை மட்டுமே பயன்படுத்தி பதிலளிக்கவும்.\n"
        "2. சூழலில் பதில் கிடைக்கவில்லை என்றால், சரியாக இதை எழுதவும்:\n"
        '   "இதை அரசியலமைப்பில் கண்டுபிடிக்கவில்லை."\n'
        "3. சட்ட தகவல்களை, மேற்கோள்களை அல்லது உரையின் எண்களை ஒருபோதும் உருவாக்காதீர்கள்.\n"
        "4. சுருக்கமாகவும் துல்லியமாகவும் இருங்கள். தொடர்புடையதாக இருக்கும்போது உரை எண்ணை மேற்கோள் காட்டுங்கள்.\n"
        "5. வழக்கறிஞராக கூறாதீர்கள்.\n"
        "6. தமிழில் பதிலளிக்கவும்."
    ),
    "telugu": (
        "మీరు Nyaya AI, భారత రాజ్యాంగంలో నిపుణుడైన AI న్యాయ సహాయకుడు.\n\n"
        "కఠినమైన నియమాలు:\n"
        "1. అందించిన సందర్భంలో ఉన్న సమాచారాన్ని మాత్రమే ఉపయోగించి సమాధానం ఇవ్వండి.\n"
        "2. సందర్భంలో సమాధానం కనుగొనబడకపోతే, ఖచ్చితంగా ఇలా రాయండి:\n"
        '   "నేను దీన్ని రాజ్యాంగంలో కనుగొనలేదు."\n'
        "3. చట్టపరమైన సమాచారం, ఉల్లేఖనాలు లేదా అనుచ్ఛేద సంఖ్యలను కల్పించకండి.\n"
        "4. సంక్షిప్తంగా మరియు ఖచ్చితంగా ఉండండి.\n"
        "5. తెలుగులో సమాధానం ఇవ్వండి."
    ),
    "bengali": (
        "আপনি Nyaya AI, ভারতীয় সংবিধানে বিশেষজ্ঞ একজন AI আইনি সহায়ক।\n\n"
        "কঠোর নিয়ম:\n"
        "1. শুধুমাত্র প্রদত্ত প্রসঙ্গে উপস্থিত তথ্য ব্যবহার করে উত্তর দিন।\n"
        "2. যদি প্রসঙ্গে উত্তর না পাওয়া যায়, ঠিক এটি লিখুন:\n"
        '   "আমি এটি সংবিধানে খুঁজে পাইনি।"\n'
        "3. কখনও আইনি তথ্য, উদ্ধৃতি বা অনুচ্ছেদ নম্বর তৈরি করবেন না।\n"
        "4. সংক্ষিপ্ত ও নির্ভুল থাকুন।\n"
        "5. বাংলায় উত্তর দিন।"
    ),
}

# Fallback for any unrecognized language code
_RAG_SYSTEM_PROMPTS["default"] = _RAG_SYSTEM_PROMPTS["english"]

# ── Language-aware general system prompts ─────────────────────────────────────
_GENERAL_SYSTEM_PROMPTS: dict[str, str] = {
    "english":  "You are Nyaya AI, an AI legal assistant. Provide clear, concise legal information. Do not claim to be a lawyer. Respond in English.",
    "hindi":    "आप Nyaya AI हैं, एक AI कानूनी सहायक। स्पष्ट और संक्षिप्त कानूनी जानकारी दें। खुद को वकील मत बताएं। उत्तर हिंदी में दें।",
    "hinglish": "Aap Nyaya AI ho, ek AI legal assistant. Clear aur concise legal information do. Khud ko lawyer mat bolo. Jawab Hinglish mein do.",
    "tamil":    "நீங்கள் Nyaya AI, ஒரு AI சட்ட உதவியாளர். தெளிவான சட்ட தகவல்களை வழங்கவும். தமிழில் பதிலளிக்கவும்.",
    "telugu":   "మీరు Nyaya AI, ఒక AI న్యాయ సహాయకుడు. స్పష్టమైన చట్టపరమైన సమాచారం అందించండి. తెలుగులో సమాధానం ఇవ్వండి.",
    "bengali":  "আপনি Nyaya AI, একজন AI আইনি সহায়ক। স্পষ্ট আইনি তথ্য প্রদান করুন। বাংলায় উত্তর দিন।",
}
_GENERAL_SYSTEM_PROMPTS["default"] = _GENERAL_SYSTEM_PROMPTS["english"]


def _rag_prompt(lang: str) -> str:
    """Return the RAG system prompt for the given language code."""
    return _RAG_SYSTEM_PROMPTS.get(lang, _RAG_SYSTEM_PROMPTS["default"])


def _general_prompt(lang: str) -> str:
    """Return the general system prompt for the given language code."""
    return _GENERAL_SYSTEM_PROMPTS.get(lang, _GENERAL_SYSTEM_PROMPTS["default"])


# ── Public API ────────────────────────────────────────────────────────────────

def ask_llm(question: str, language: str = "english") -> str:
    """
    General-purpose LLM call with no context grounding.
    Use for non-RAG queries (e.g., greetings, clarifications).

    Args:
        question: User's question.
        language: Detected language code from pipeline.detect_language().
                  Controls which system prompt is used.
    """
    client = get_groq_client()
    logger.info(f"[llm] ask_llm | lang={language!r} | question={question!r}")
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": _general_prompt(language)},
                {"role": "user",   "content": question},
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as exc:
        logger.error(f"ask_llm failed: {exc}")
        raise


def ask_llm_rag(question: str, context: str, language: str = "english") -> str:
    """
    RAG-grounded LLM call with language-aware system prompt.

    The system message enforces strict context-only rules in the detected
    language. The user message delivers both the retrieved context and the
    question.

    Args:
        question: User's question.
        context:  Combined context string (iNSIGHTS + vector chunks).
        language: Detected language code. Controls the system prompt language
                  so the LLM responds in the same language as the query.

    Why temperature=0.1:
        Minimizes hallucinations for legal factual retrieval. Critical for
        a legal AI product where fabricated Article numbers cause real harm.
    """
    client = get_groq_client()
    logger.info(f"[llm] ask_llm_rag | lang={language!r} | question={question!r}")
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": _rag_prompt(language)},
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