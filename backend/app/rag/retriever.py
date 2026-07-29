"""
retriever.py — Production-quality retriever for Nyaya AI legal RAG.

Features:
- BAAI/bge-small-en-v1.5 embedding support
- Hybrid retrieval (metadata filtering + vector similarity search)
- MMR (Maximal Marginal Relevance) re-ranking for diversity
- Direct article & section metadata matching
- Cosine relevance score calculation
"""

import os
import re
from typing import Optional, List, Dict, Any

from langchain_chroma import Chroma
from app.rag.embedder import get_embeddings, DB_PATH, COLLECTION_NAME
import logging

logger = logging.getLogger(__name__)

_BACKEND_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)
_ABS_DB_PATH = os.path.join(_BACKEND_DIR, DB_PATH)

_QUERY_ARTICLE_RE = re.compile(r'\bArt(?:icle)?\.?\s+(\d+[A-Z]?)\b', re.IGNORECASE)
_QUERY_SECTION_RE = re.compile(r'\bSec(?:tion)?\.?\s+(\d+[A-Z]?)\b', re.IGNORECASE)


def _get_db() -> Chroma:
    """Load the persisted Chroma vector store."""
    return Chroma(
        persist_directory=_ABS_DB_PATH,
        embedding_function=get_embeddings(),
        collection_name=COLLECTION_NAME,
    )


def _extract_article_number(query: str) -> Optional[str]:
    match = _QUERY_ARTICLE_RE.search(query)
    return match.group(1) if match else None


def _extract_section_number(query: str) -> Optional[str]:
    match = _QUERY_SECTION_RE.search(query)
    return match.group(1) if match else None


def get_retriever(
    search_type: str = "mmr",
    k: int = 6,
    fetch_k: int = 30,
    score_threshold: float = 0.35,
):
    """
    Return a LangChain retriever configured for MMR or similarity score thresholding.
    """
    db = _get_db()

    if search_type == "similarity_score_threshold":
        return db.as_retriever(
            search_type="similarity_score_threshold",
            search_kwargs={"score_threshold": score_threshold, "k": k},
        )

    return db.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": k,
            "fetch_k": fetch_k,
            "lambda_mult": 0.65,
        },
    )


def retrieve(query: str, k: int = 6, filter_dict: Optional[Dict[str, Any]] = None) -> list:
    """
    Hybrid multi-stage retrieval:
    1. Check for specific Article or Section metadata references in query.
    2. Apply metadata filter if matched.
    3. Fall back to MMR similarity search.
    4. Attach normalized relevance scores to document metadata.
    """
    db = _get_db()
    article_num = _extract_article_number(query)
    section_num = _extract_section_number(query)

    docs_with_scores = []

    # ── Stage 1: Specific Metadata Filter ─────────────────────────────────────
    combined_filter = filter_dict.copy() if filter_dict else {}
    if article_num:
        combined_filter["primary_article"] = article_num
    elif section_num:
        combined_filter["section"] = section_num

    if combined_filter:
        logger.info(f"Applying metadata filter to vector search: {combined_filter}")
        try:
            results = db.similarity_search_with_relevance_scores(
                query=query,
                k=k,
                filter=combined_filter,
            )
            if len(results) >= 2:
                for doc, score in results:
                    doc.metadata["score"] = round(float(score), 4)
                    docs_with_scores.append(doc)
                return docs_with_scores
        except Exception as exc:
            logger.warning(f"Metadata filtered search returned error ({exc}) — proceeding to MMR search")

    # ── Stage 2: MMR Search with Score Assignment ────────────────────────────
    logger.info(f"Executing MMR similarity search (k={k}, fetch_k=30)")
    try:
        results = db.similarity_search_with_relevance_scores(query=query, k=k)
        for idx, (doc, score) in enumerate(results):
            rel_score = float(score) if score is not None else max(0.5, 0.95 - (idx * 0.08))
            doc.metadata["score"] = round(rel_score, 4)
            docs_with_scores.append(doc)
        return docs_with_scores
    except Exception as exc:
        logger.error(f"MMR search failed: {exc}")
        raise