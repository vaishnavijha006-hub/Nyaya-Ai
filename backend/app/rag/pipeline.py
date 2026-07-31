"""
pipeline.py — Main RAG pipeline for Nyaya AI.

Pipeline flow (Phase 9 — Conversation Memory + Contextual Retrieval):
─────────────────────────────────────────────────────────────────────
  User Query + History
      │
      ▼
  ① Language Detection          (detect_language)
      │
      ▼
  ② ConversationMemory           (memory_from_history)
      │    ↓ entity extraction + reference resolution
      ▼
  ③ Retrieval Query Expansion    (memory.resolve_reference)
      │    ↓ expanded retrieval query (NOT sent to LLM)
      ▼
  ④ Vector + BM25 Search         (retrieve + conversation_context)
      │    ↓ local chunks
      ▼
  ⑤ Citation Extraction          (build_citations)
      │    ↓ CitationItem list
      ▼
  ⑥ LLM Generation               (ask_llm_rag)
      │    receives original question + history
      ▼
  ⑦ Structured Response
      answer + citations[] returned separately

Key design decisions:
- Retrieval logic, embeddings, parser: UNCHANGED.
- Only the retrieval query is expanded — the LLM receives the raw question.
- ConversationMemory caps at 6 turns / 2000 characters automatically.
- Explicit entity in current query always overrides history context.
"""

import logging
import re
from typing import Optional
from app.rag.retriever import retrieve
from app.services import llm as llm_service
from app.rag.citations import build_citations, build_readable_citation_block
from app.rag.memory import ConversationMemory, memory_from_history

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
        return 'hinglish' # Romanized Hindi

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
    'ur': 'Urdu',
    'hinglish': 'Hinglish'
}

# ── Main pipeline ─────────────────────────────────────────────────────────────

def ask_rag(question: str, history: Optional[list] = None, audience: str = "default") -> dict:
    """
    Full RAG pipeline: detect → memory → expanded retrieval → generate → return.

    Args:
        question: The user's current question (used unchanged for LLM).
        history:  Optional list of {'role': str, 'content': str} dicts from
                  the conversation so far. Used ONLY for retrieval expansion.
    """

    # ── Step 1: Language Detection ────────────────────────────────────────────
    lang = detect_language(question)
    response_lang_name = LANGUAGE_NAME_MAP.get(lang, 'English')
    logger.info(f"[pipeline] Detected language: {lang!r} ({response_lang_name}) | Query: {question!r}")

    # ── Step 2: Conversation Memory ───────────────────────────────────────────
    # Build memory from history, then resolve vague references.
    # The expanded query is used ONLY for retrieval — LLM gets the raw question.
    mem = memory_from_history(history or [])
    expanded_query = mem.resolve_reference(question)
    conversation_context = mem.get_context_string() if len(mem) > 0 else None

    if expanded_query != question:
        logger.info(f"[pipeline] Reference resolved: {question!r} → {expanded_query!r}")

    # ── Step 3: Vector + BM25 Search (context-augmented) ─────────────────────
    docs = retrieve(expanded_query, conversation_context=conversation_context)
    logger.info(f"[pipeline] Retrieved {len(docs)} vector chunks.")

    # ── Step 3: Build structured citations (Phase 6) ──────────────────────────
    # Citations are extracted here, AFTER retrieval, BEFORE LLM call.
    # They are never injected as raw JSON into the prompt.
    citations = build_citations(docs)
    readable_citation_block = build_readable_citation_block(citations)
    logger.info(f"[pipeline] Built {len(citations)} citation(s).")

    # ── Step 4: Build context string ──────────────────────────────────────────
    context_parts = []

    # Prepend human-readable citation summary block so LLM knows the sources
    if readable_citation_block:
        context_parts.append(readable_citation_block)

    # Append local vector chunks with provenance labels
    for doc in docs:
        page      = doc.metadata.get("page", "?")
        act_name  = doc.metadata.get("act_name") or doc.metadata.get("title") or "Legal Document"
        art       = doc.metadata.get("primary_article") or doc.metadata.get("article") or ""
        sec       = doc.metadata.get("section") or ""
        if art:
            ref_label = f"Article {art}"
        elif sec:
            ref_label = f"Section {sec}"
        else:
            ref_label = f"Page {page}"
        context_parts.append(
            f"=== {act_name} | {ref_label} | Page {page} ===\n\n"
            + doc.page_content
        )

    context = "\n\n---\n\n".join(context_parts)
    logger.debug(f"[pipeline] Total context length: {len(context)} chars")

    # ── Step 5: LLM Generation ────────────────────────────────────────────────
    answer = llm_service.ask_llm_rag(question=question, context=context, language=lang, audience=audience)
    logger.info("[pipeline] LLM generation complete.")

    # ── Step 6: Build serializable source list (backward-compatible) ──────────
    vector_sources = []
    for doc in docs:
        # Confidence: use fusion_score / confidence from retriever if present
        metadata_score = (
            doc.metadata.get("confidence")
            or doc.metadata.get("fusion_score")
            or doc.metadata.get("score")
        )
        if metadata_score is None:
            idx = len(vector_sources)
            metadata_score = max(0.5, 0.95 - (idx * 0.12))

        vector_sources.append({
            "page":            doc.metadata.get("page"),
            "source":          doc.metadata.get("source", "Constitution of India"),
            "primary_article": doc.metadata.get("primary_article", ""),
            "article_refs":    doc.metadata.get("article_refs", ""),
            "content_preview": doc.page_content[:350],
            "relevance_score": round(float(metadata_score), 2),
            "origin":          "vector",
        })

    return {
        "answer":            answer,
        "detected_language": lang,
        "sources":           vector_sources,
        "response_language": response_lang_name,
        # Phase 6: structured citations returned separately from sources
        "citations":         citations,
    }


# ── Phase 10: Session-Scoped Pipeline ────────────────────────────────────────

def ask_rag_session(question: str, session_id: str, history: Optional[list] = None, audience: str = "default") -> dict:
    """
    Phase 10 RAG pipeline for uploaded-PDF sessions.

    Routes retrieval to the user's temporary session collection instead of the
    permanent Constitution collection. Everything else (memory, citations,
    LLM generation) is identical to ask_rag().

    Args:
        question:   The user's current question (unchanged for LLM).
        session_id: UUID from POST /pdf/upload — identifies the session collection.
        history:    Optional conversation history for memory-based query expansion.

    Returns:
        Same dict schema as ask_rag() — fully backward-compatible with the API.
    """
    from app.rag.session_retriever import retrieve_session  # late import to avoid circular

    # ── Step 1: Language Detection ────────────────────────────────────────────
    lang = detect_language(question)
    response_lang_name = LANGUAGE_NAME_MAP.get(lang, 'English')
    logger.info(f"[session_pipeline] lang={lang!r} session={session_id} query={question!r}")

    # ── Step 2: Conversation Memory ───────────────────────────────────────────
    mem = memory_from_history(history or [])
    expanded_query = mem.resolve_reference(question)
    conversation_context = mem.get_context_string() if len(mem) > 0 else None

    if expanded_query != question:
        logger.info(f"[session_pipeline] Reference resolved: {question!r} → {expanded_query!r}")

    # ── Step 3: Session-Scoped Retrieval ──────────────────────────────────────
    docs = retrieve_session(session_id, expanded_query, conversation_context=conversation_context)
    logger.info(f"[session_pipeline] Retrieved {len(docs)} chunks from session {session_id}")

    # ── Step 4: Citations (Phase 6 — same logic, different source) ────────────
    citations = build_citations(docs)
    readable_citation_block = build_readable_citation_block(citations)
    logger.info(f"[session_pipeline] Built {len(citations)} citation(s).")

    # ── Step 5: Build LLM context ─────────────────────────────────────────────
    context_parts = []
    if readable_citation_block:
        context_parts.append(readable_citation_block)

    for doc in docs:
        page     = doc.metadata.get("page", "?")
        act_name = doc.metadata.get("act_name") or doc.metadata.get("title") or "Uploaded Document"
        art      = doc.metadata.get("primary_article") or doc.metadata.get("article") or ""
        sec      = doc.metadata.get("section") or ""
        if art:
            ref_label = f"Article {art}"
        elif sec:
            ref_label = f"Section / Clause {sec}"
        else:
            ref_label = f"Page {page}"
        context_parts.append(
            f"=== {act_name} | {ref_label} | Page {page} ===\n\n"
            + doc.page_content
        )

    context = "\n\n---\n\n".join(context_parts)

    # ── Step 6: LLM Generation (same LLM, raw question unchanged) ────────────
    answer = llm_service.ask_llm_rag(question=question, context=context, language=lang, audience=audience)
    logger.info(f"[session_pipeline] LLM generation complete for session {session_id}")

    # ── Step 7: Serializable sources ─────────────────────────────────────────
    vector_sources = []
    for idx, doc in enumerate(docs):
        score = (
            doc.metadata.get("confidence")
            or doc.metadata.get("fusion_score")
            or max(0.5, 0.95 - idx * 0.10)
        )
        vector_sources.append({
            "page":            doc.metadata.get("page"),
            "source":          doc.metadata.get("source", "Uploaded Document"),
            "primary_article": doc.metadata.get("primary_article", ""),
            "article_refs":    doc.metadata.get("article_refs", ""),
            "content_preview": doc.page_content[:350],
            "relevance_score": round(float(score), 2),
            "origin":          "session",
        })

    return {
        "answer":            answer,
        "detected_language": lang,
        "sources":           vector_sources,
        "response_language": response_lang_name,
        "citations":         citations,
        "session_id":        session_id,
    }
