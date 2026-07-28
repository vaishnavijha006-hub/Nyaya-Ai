"""
retriever.py — Production-quality retriever for Nyaya AI legal RAG.

Retrieval strategy for legal documents:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The Constitution has these retrieval challenges:
  1. Many Articles cross-reference others (Art. 32, Art. 226, Art. 14 appear everywhere)
  2. Short Articles (Article 21 is 1 sentence) are easily outscored by longer chunks
     that happen to contain "Article 21" as a cross-reference
  3. The query "Article 21" can match both the definition AND citations of Article 21

Solutions implemented:
  a) MMR (Maximal Marginal Relevance): fetch_k=30 candidates, pick k=6 diverse ones.
     Prevents the top-6 being dominated by cross-reference chunks that all say
     "…as per Article 21…"
  b) metadata_filter by primary_article: if the query mentions a specific Article
     number, filter Chroma to only return chunks WHERE primary_article = "21".
     This is the strongest fix — bypasses embedding similarity entirely for
     direct article queries.
  c) score_threshold fallback: if metadata filtering returns too few results,
     fall back to threshold-based similarity search.

Path anchoring:
  DB_PATH is a relative path from backend/. We anchor it absolutely to this
  file's location to avoid CWD-dependent failures.
"""

import os
import re
from typing import Optional

from langchain_chroma import Chroma
from app.rag.embedder import get_embeddings, DB_PATH, COLLECTION_NAME
import logging

logger = logging.getLogger(__name__)

# Anchor DB path to backend/ directory regardless of where Python is run from
# retriever.py lives at: backend/app/rag/retriever.py → go up 3 levels
_BACKEND_DIR = os.path.dirname(         # backend/
    os.path.dirname(                    # backend/app/
        os.path.dirname(                # backend/app/rag/
            os.path.abspath(__file__)
        )
    )
)
_ABS_DB_PATH = os.path.join(_BACKEND_DIR, DB_PATH)

# Regex to extract Article number from a query
# Matches: "Article 21", "art. 21", "Article 21A", "Art 32"
_QUERY_ARTICLE_RE = re.compile(
    r'\bArt(?:icle)?\.?\s+(\d+[A-Z]?)\b',
    re.IGNORECASE
)


def _get_db() -> Chroma:
    """Load the persisted Chroma vector store."""
    return Chroma(
        persist_directory=_ABS_DB_PATH,
        embedding_function=get_embeddings(),
        collection_name=COLLECTION_NAME,
    )


def _extract_article_number(query: str) -> Optional[str]:
    """
    Extract article number from query if present.
    "What is Article 21?" → "21"
    "Right to Life Article 21 Constitution India" → "21"
    "Fundamental rights" → None
    """
    match = _QUERY_ARTICLE_RE.search(query)
    return match.group(1) if match else None


def get_retriever(
    search_type: str = "mmr",
    k: int = 6,
    fetch_k: int = 30,
    score_threshold: float = 0.35,
):
    """
    Return a LangChain retriever for the Nyaya AI legal assistant.

    Defaults to MMR with k=6, fetch_k=30.
    For article-specific queries, use retrieve() which applies metadata filtering.
    """
    db = _get_db()

    if search_type == "similarity_score_threshold":
        return db.as_retriever(
            search_type="similarity_score_threshold",
            search_kwargs={"score_threshold": score_threshold, "k": k},
        )

    # MMR: fetch 30 candidates, re-rank for diversity, return top 6
    return db.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": k,
            "fetch_k": fetch_k,
            "lambda_mult": 0.65,    # 65% relevance, 35% diversity
        },
    )


def retrieve(query: str, k: int = 6) -> list:
    """
    Smart retrieval with automatic metadata filtering for article queries.

    Strategy:
    1. Parse query for a specific Article number (e.g., "Article 21" → "21")
    2. If found: filter Chroma WHERE primary_article = "21" → guarantees
       the correct article is returned regardless of embedding similarity.
    3. If not found (or filter returns < 2 results): fall back to MMR search.

    This two-stage approach is production-quality for legal documents because:
    - Direct article queries ("What is Article 21?") get exact metadata match
    - General queries ("What are fundamental rights?") get diverse MMR results

    Args:
        query: Natural language question
        k: Number of documents to return

    Returns:
        List of LangChain Document objects
    """
    db = _get_db()
    article_num = _extract_article_number(query)

    # Stage 1: Metadata-filtered retrieval for specific article queries
    if article_num:
        logger.info(f"Detected Article {article_num} in query — applying metadata filter")
        try:
            filter_results = db.similarity_search(
                query=query,
                k=k,
                filter={"primary_article": article_num},
            )
            if len(filter_results) >= 2:
                logger.info(f"Metadata filter returned {len(filter_results)} chunks")
                return filter_results
            else:
                logger.info(f"Filter returned only {len(filter_results)} chunks — falling back to MMR")
        except Exception as exc:
            logger.error(f"Metadata filter failed ({exc}) — falling back to MMR")

    # Stage 2: MMR fallback for general queries or when filter yields too few results
    logger.info(f"Using MMR search (fetch_k=30, k={k})")
    try:
        retriever = get_retriever(k=k)
        return retriever.invoke(query)
    except Exception as exc:
        logger.error(f"MMR search failed: {exc}")
        raise