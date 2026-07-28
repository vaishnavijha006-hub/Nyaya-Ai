"""
pipeline.py — Main RAG pipeline for Nyaya AI.

Simplified pipeline flow (Phase 4):
─────────────────────────────────
  User Query
      │
      ▼
  ① Language Detection          (detect_language)
      │
      ▼
  ② Vector Search               (retrieve)
      │    ↓ local Constitution chunks
      ▼
  ③ LLM Generation              (ask_llm_rag)
      │
      ▼
  ④ Citation-based Legal Answer

Key design decisions:
- The pipeline processes local vector store retrieved document chunks.
- Language detection is a lightweight regex/keyword heuristic.
- The `detected_language` field is returned in the API response.
"""

import logging
import re
from app.rag.retriever import retrieve
from app.services.llm import ask_llm_rag

logger = logging.getLogger(__name__)

# ── Language detection ────────────────────────────────────────────────────────
# Standardized ISO codes:
# 'en' -> English
# 'hi' -> Hindi / Hinglish (Hinglish gets mapped to Hindi response written in Devanagari)
# 'mr' -> Marathi
# 'ta' -> Tamil
# 'te' -> Telugu
# 'bn' -> Bengali
# 'gu' -> Gujarati
# 'kn' -> Kannada
# 'ml' -> Malayalam
# 'pa' -> Punjabi
# 'ur' -> Urdu

_HINDI_RE     = re.compile(r'[\u0900-\u097F]')  # Devnagari block (shared by Hindi, Marathi, etc.)
_TAMIL_RE     = re.compile(r'[\u0B80-\u0BFF]')  # Tamil block
_TELUGU_RE    = re.compile(r'[\u0C00-\u0C7F]')  # Telugu block
_BENGALI_RE   = re.compile(r'[\u0980-\u09FF]')  # Bengali block
_GUJARATI_RE  = re.compile(r'[\u0A80-\u0AFF]')  # Gujarati block
_KANNADA_RE   = re.compile(r'[\u0C80-\u0CFF]')  # Kannada block
_MALAYALAM_RE = re.compile(r'[\u0D00-\u0D7F]')  # Malayalam block
_PUNJABI_RE   = re.compile(r'[\u0A00-\u0A7F]')  # Gurmukhi / Punjabi block
_URDU_RE      = re.compile(r'[\u0600-\u06FF]')  # Arabic / Urdu block

# Common Hinglish signal words (Roman-script Hindi mixed with English)
_HINGLISH_WORDS = {
    'kya', 'hai', 'mujhe', 'kaise', 'aur', 'nahi', 'mera', 'meri',
    'yeh', 'woh', 'batao', 'samjhao', 'kanoon', 'adhikar', 'court',
    'police', 'help', 'karo', 'dena', 'lena', 'pata', 'sanga', 'bataon', 'samjha'
}

# Marathi-specific Devnagari words to distinguish Marathi from Hindi
_MARATHI_KEYWORDS = {'संगा', 'सांगा', 'कलम', 'बद्दल', 'माहिती', 'आहे', 'का', 'करणे'}

def detect_language(text: str) -> str:
    """
    Detect the primary language of the user query and return its standardized ISO code.
    """
    if _TAMIL_RE.search(text):
        return 'ta'
    if _TELUGU_RE.search(text):
        return 'te'
    if _BENGALI_RE.search(text):
        return 'bn'
    if _GUJARATI_RE.search(text):
        return 'gu'
    if _KANNADA_RE.search(text):
        return 'kn'
    if _MALAYALAM_RE.search(text):
        return 'ml'
    if _PUNJABI_RE.search(text):
        return 'pa'
    if _URDU_RE.search(text):
        return 'ur'
    if _HINDI_RE.search(text):
        # Check Marathi vocabulary keywords
        tokens = set(re.findall(r'\b\w+\b', text.lower()))
        if tokens & _MARATHI_KEYWORDS:
            return 'mr'
        return 'hi'

    # Check Romanized Indian languages (Hinglish/Hinglish-like)
    tokens = set(re.findall(r'\b\w+\b', text.lower()))
    
    # Check romanized Marathi phrases specifically (e.g., 'sanga', 'kalam', 'baddal')
    roman_marathi_keywords = {'sanga', 'kalam', 'baddal', 'baddal saanga'}
    if tokens & roman_marathi_keywords:
        return 'mr'

    if len(tokens & _HINGLISH_WORDS) >= 2:
        return 'hi' # Hinglish mapped to 'hi' response language in Devanagari

    return 'en'

# Display language mapping name
LANGUAGE_NAME_MAP = {
    'en': 'English',
    'hi': 'Hindi',
    'mr': 'Marathi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'bn': 'Bengali',
    'gu': 'Gujarati',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'pa': 'Punjabi',
    'ur': 'Urdu'
}

# ── Main pipeline ─────────────────────────────────────────────────────────────

def ask_rag(question: str) -> dict:
    """
    Full RAG pipeline: detect → retrieve → generate → return.
    """

    # ── Step 1: Language Detection ────────────────────────────────────────────
    lang = detect_language(question)
    response_lang_name = LANGUAGE_NAME_MAP.get(lang, 'English')
    logger.info(f"[pipeline] Detected language: {lang!r} ({response_lang_name}) | Query: {question!r}")

    # ── Step 2: Vector Search ─────────────────────────────────────────────────
    docs = retrieve(question)
    logger.info(f"[pipeline] Retrieved {len(docs)} vector chunks.")

    # ── Step 3: Build context string ──────────────────────────────────────────
    context_parts = []

    # Append local vector chunks with article provenance labels
    for doc in docs:
        page      = doc.metadata.get("page", "?")
        art       = doc.metadata.get("primary_article", "")
        art_label = f"Article {art}" if art else f"Page {page}"
        context_parts.append(
            f"=== Constitution of India | {art_label} | Page {page} ===\n\n"
            + doc.page_content
        )

    context = "\n\n---\n\n".join(context_parts)
    logger.debug(f"[pipeline] Total context length: {len(context)} chars")

    # ── Step 4: LLM Generation ────────────────────────────────────────────────
    answer = ask_llm_rag(question=question, context=context, language=lang)
    logger.info("[pipeline] LLM generation complete.")

    # ── Step 5: Build serializable source list ────────────────────────────────
    vector_sources = []
    for doc in docs:
        metadata_score = doc.metadata.get("score")
        if metadata_score is None:
            idx = len(vector_sources)
            metadata_score = max(0.5, 0.95 - (idx * 0.12))
        
        vector_sources.append({
            "page":            doc.metadata.get("page"),
            "source":          doc.metadata.get("source", "Constitution of India"),
            "primary_article": doc.metadata.get("primary_article", ""),
            "article_refs":    doc.metadata.get("article_refs", ""),
            "content_preview": doc.page_content[:350],
            "relevance_score": round(metadata_score, 2),
            "origin":          "vector",
        })

    return {
        "answer":            answer,
        "detected_language": lang,
        "sources":           vector_sources,
        "response_language": response_lang_name
    }
