"""
pipeline.py — Main RAG pipeline for Nyaya AI.

Upgraded pipeline flow (Phase 3):
─────────────────────────────────
  User Query
      │
      ▼
  ① Language Detection          (detect_language)
      │
      ▼
  ② iNSIGHTS Deep Search        (fetch_insights_context)
      │    ↓ external sources / citations
      ▼
  ③ Vector Search               (retrieve)
      │    ↓ local Constitution chunks
      ▼
  ④ Context Merge               (insights + vector)
      │
      ▼
  ⑤ LLM Generation              (ask_llm_rag)
      │
      ▼
  Citation-based Legal Answer

Key design decisions:
- iNSIGHTS context is prepended before local vector chunks so the LLM
  sees external authoritative sources first.
- Language detection is a lightweight regex/keyword heuristic — no external
  model dependency. Full Indic NLP can slot in at this layer later.
- If iNSIGHTS is unconfigured, the pipeline gracefully skips Step ② and
  continues with local vector search only.
- The `detected_language` field is returned in the API response so the
  frontend can display it (and future multilingual responses can branch here).
"""

import logging
import re
from app.rag.retriever import retrieve
from app.services.llm import ask_llm_rag
from app.services.insights import fetch_insights_context

logger = logging.getLogger(__name__)

# ── Language detection ────────────────────────────────────────────────────────
# Lightweight heuristic: checks Unicode script ranges & common Hinglish patterns.
# Replace with langdetect / IndicNLP for production multilingual support.

_HINDI_RE    = re.compile(r'[\u0900-\u097F]')  # Devanagari block
_TAMIL_RE    = re.compile(r'[\u0B80-\u0BFF]')  # Tamil block
_TELUGU_RE   = re.compile(r'[\u0C00-\u0C7F]')  # Telugu block
_BENGALI_RE  = re.compile(r'[\u0980-\u09FF]')  # Bengali block
_MARATHI_RE  = re.compile(r'[\u0900-\u097F]')  # Marathi uses Devanagari (same range, distinguished by vocabulary)

# Common Hinglish signal words (Roman-script Hindi mixed with English)
_HINGLISH_WORDS = {
    'kya', 'hai', 'mujhe', 'kaise', 'aur', 'nahi', 'mera', 'meri',
    'yeh', 'woh', 'batao', 'samjhao', 'kanoon', 'adhikar', 'court',
    'police', 'help', 'karo', 'dena', 'lena', 'pata',
}

def detect_language(text: str) -> str:
    """
    Detect the primary language/script of the user query.

    Returns one of:
        'hindi'    — Devanagari script detected
        'tamil'    — Tamil script detected
        'telugu'   — Telugu script detected
        'bengali'  — Bengali script detected
        'hinglish' — Roman-script Hindi/English mix detected
        'english'  — Default fallback
    """
    if _TAMIL_RE.search(text):
        return 'tamil'
    if _TELUGU_RE.search(text):
        return 'telugu'
    if _BENGALI_RE.search(text):
        return 'bengali'
    if _HINDI_RE.search(text):
        # Could be Hindi or Marathi — both use Devanagari
        return 'hindi'

    # Hinglish: ≥2 signal words present in the lowercased query
    tokens = set(re.findall(r'\b\w+\b', text.lower()))
    if len(tokens & _HINGLISH_WORDS) >= 2:
        return 'hinglish'

    return 'english'


# ── Main pipeline ─────────────────────────────────────────────────────────────

def ask_rag(question: str) -> dict:
    """
    Full RAG pipeline: detect → insights → retrieve → merge → generate → return.

    Returns:
        {
            "answer":            str,
            "detected_language": str,
            "sources": [
                {
                    "page":            int | None,
                    "source":          str | None,
                    "primary_article": str,
                    "article_refs":    str,
                    "content_preview": str,
                    "origin":          "vector" | "insights"
                },
                ...
            ]
        }
    """

    # ── Step 1: Language Detection ────────────────────────────────────────────
    lang = detect_language(question)
    logger.info(f"[pipeline] Detected language: {lang!r} | Query: {question!r}")

    # ── Step 2: iNSIGHTS Deep Search ──────────────────────────────────────────
    insights_context = fetch_insights_context(question)
    has_insights     = bool(insights_context)

    if has_insights:
        logger.info("[pipeline] iNSIGHTS context received — merging with vector results.")
    else:
        logger.info("[pipeline] No iNSIGHTS context — using local vector search only.")

    # ── Step 3: Vector Search ─────────────────────────────────────────────────
    docs = retrieve(question)
    logger.info(f"[pipeline] Retrieved {len(docs)} vector chunks.")

    # ── Step 4: Build merged context string ───────────────────────────────────
    context_parts = []

    # 4a. Prepend iNSIGHTS sources (if available)
    if has_insights:
        context_parts.append(
            "=== External Legal Sources (iNSIGHTS Deep Search) ===\n\n"
            + insights_context
        )

    # 4b. Append local vector chunks with article provenance labels
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

    # ── Step 5: LLM Generation ────────────────────────────────────────────────
    answer = ask_llm_rag(question=question, context=context, language=lang)
    logger.info("[pipeline] LLM generation complete.")

    # ── Step 6: Build serializable source list ────────────────────────────────
    vector_sources = [
        {
            "page":            doc.metadata.get("page"),
            "source":          doc.metadata.get("source"),
            "primary_article": doc.metadata.get("primary_article", ""),
            "article_refs":    doc.metadata.get("article_refs", ""),
            "content_preview": doc.page_content[:300],
            "origin":          "vector",
        }
        for doc in docs
    ]

    # iNSIGHTS sources are summarised as a single entry if present
    insights_sources = []
    if has_insights:
        insights_sources = [
            {
                "page":            None,
                "source":          "iNSIGHTS Deep Search",
                "primary_article": "",
                "article_refs":    "",
                "content_preview": insights_context[:300],
                "origin":          "insights",
            }
        ]

    return {
        "answer":            answer,
        "detected_language": lang,
        "sources":           insights_sources + vector_sources,
    }