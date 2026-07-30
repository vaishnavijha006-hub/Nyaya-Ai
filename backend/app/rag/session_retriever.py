"""
session_retriever.py — Phase 10: Session-Scoped Retriever for Nyaya AI.

Provides hybrid BM25 + vector retrieval over a single temporary session
collection, mirroring the production retriever's ranking logic.

Key design decisions:
    - Uses the SAME embeddings model (BAAI/bge-small-en-v1.5) as production.
    - Uses the SAME BM25 + vector + confidence scoring as retriever.py.
    - Loads each session's Chroma collection lazily from disk.
    - NO caching: session collections are ephemeral; we load fresh each time.
    - Strict isolation: the collection name is session_<uuid>, never shared.
    - Citations work automatically (same metadata schema as production chunks).
    - ConversationMemory works transparently (caller passes expanded_query).

NOT modified:
    - retriever.py (production retriever — untouched)
    - embedder.py  (embedding model — shared, read-only)
    - splitter.py  (chunk schema — shared, read-only)
    - Chroma persistent DB for Constitution
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple

from rank_bm25 import BM25Okapi
from langchain_core.documents import Document
from langchain_chroma import Chroma

from app.rag.embedder import get_embeddings
from app.rag.session_store import SESSION_DB_ROOT, get_session

logger = logging.getLogger(__name__)

_CONFIDENCE_THRESHOLD = 0.20   # Lower than prod (user docs may have lower baseline)


def _tokenize(text: str) -> List[str]:
    return re.findall(r'\w+', text.lower())


def _load_session_db(session_id: str) -> Optional[Chroma]:
    """Load the Chroma collection for this session. Returns None if not found."""
    meta = get_session(session_id)
    if meta is None:
        return None
    db_path = meta.db_path
    if not db_path.exists():
        logger.warning(f"[session_retriever] DB path missing for session {session_id}: {db_path}")
        return None
    return Chroma(
        persist_directory=str(db_path),
        embedding_function=get_embeddings(),
        collection_name=meta.collection_name,
    )


def _build_bm25(db: Chroma) -> Tuple[BM25Okapi, List[Document]]:
    """Build an in-memory BM25 index over the session collection."""
    data = db.get()
    ids = data.get("ids", [])
    texts = data.get("documents", [])
    metadatas = data.get("metadatas", [])

    documents: List[Document] = []
    corpus: List[List[str]] = []
    for i, txt in enumerate(texts):
        meta = metadatas[i] if i < len(metadatas) else {}
        meta["chunk_id"] = ids[i] if i < len(ids) else f"chunk_{i}"
        documents.append(Document(page_content=txt, metadata=meta))
        corpus.append(_tokenize(txt))

    if not corpus:
        return BM25Okapi([[""]]), documents

    return BM25Okapi(corpus), documents


def _weighted_fusion(
    dense: List[Tuple[Document, float]],
    bm25_docs: List[Document],
    top_k: int = 8,
    w_vec: float = 0.50,
    w_bm25: float = 0.50,
) -> List[Document]:
    """Simple weighted fusion for session retriever (no metadata filter needed)."""
    doc_map: Dict[str, Document] = {}
    vec_scores: Dict[str, float] = {}
    bm25_scores: Dict[str, float] = {}

    for doc, sim in dense:
        cid = doc.metadata.get("chunk_id", doc.page_content[:80])
        doc_map[cid] = doc
        vec_scores[cid] = max(0.0, float(sim))

    max_bm25 = max((d.metadata.get("bm25_score", 0.0) for d in bm25_docs), default=1.0)
    if max_bm25 <= 0:
        max_bm25 = 1.0
    for doc in bm25_docs:
        cid = doc.metadata.get("chunk_id", doc.page_content[:80])
        if cid not in doc_map:
            doc_map[cid] = doc
        bm25_scores[cid] = min(1.0, float(doc.metadata.get("bm25_score", 0.0)) / max_bm25)

    fused: List[Document] = []
    for cid, doc in doc_map.items():
        v = vec_scores.get(cid, 0.0)
        b = bm25_scores.get(cid, 0.0)
        conf = (w_vec * v) + (w_bm25 * b)
        doc.metadata["vector_score"] = round(v, 4)
        doc.metadata["bm25_norm_score"] = round(b, 4)
        doc.metadata["fusion_score"] = round(conf, 4)
        doc.metadata["confidence"] = round(conf, 4)
        fused.append(doc)

    fused.sort(key=lambda d: d.metadata.get("confidence", 0.0), reverse=True)
    return fused[:top_k]


def retrieve_session(
    session_id: str,
    query: str,
    k: int = 6,
    conversation_context: Optional[str] = None,
) -> List[Document]:
    """
    Hybrid BM25 + vector retrieval scoped to a single session collection.

    Args:
        session_id:           UUID identifying the session (from /pdf/upload).
        query:                Retrieval query (may be memory-expanded by caller).
        k:                    Number of top docs to return.
        conversation_context: Optional memory context string for augmentation.

    Returns:
        List of ranked Documents with confidence scores, or a single
        "not found" Document if the session is missing/expired.

    Strict isolation: only this session's collection_name is queried.
    """
    db = _load_session_db(session_id)
    if db is None:
        logger.warning(f"[session_retriever] Session {session_id} not found or expired.")
        return [Document(
            page_content="The uploaded document session has expired or does not exist. Please upload the PDF again.",
            metadata={"confidence": 0.0, "session_expired": True, "session_id": session_id}
        )]

    # Augment query with memory context (same pattern as production retriever)
    retrieval_query = query
    if conversation_context and conversation_context.strip():
        retrieval_query = f"{query} {conversation_context.strip()}"

    # ── Vector search ──────────────────────────────────────────────────────────
    try:
        raw = db.similarity_search_with_relevance_scores(retrieval_query, k=min(15, k * 2))
        dense = [(doc, float(score)) for doc, score in raw]
    except Exception as e:
        logger.error(f"[session_retriever] Vector search failed for session {session_id}: {e}")
        dense = []

    # ── BM25 search ────────────────────────────────────────────────────────────
    try:
        bm25, all_docs = _build_bm25(db)
        tokens = _tokenize(retrieval_query)
        if tokens and all_docs:
            scores = bm25.get_scores(tokens)
            top_idxs = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:15]
            bm25_results: List[Document] = []
            for idx in top_idxs:
                if scores[idx] > 0:
                    d = Document(
                        page_content=all_docs[idx].page_content,
                        metadata=all_docs[idx].metadata.copy()
                    )
                    d.metadata["bm25_score"] = round(float(scores[idx]), 4)
                    bm25_results.append(d)
        else:
            bm25_results = []
    except Exception as e:
        logger.error(f"[session_retriever] BM25 failed for session {session_id}: {e}")
        bm25_results = []

    # ── Fusion ─────────────────────────────────────────────────────────────────
    fused = _weighted_fusion(dense, bm25_results, top_k=k * 2)

    if not fused:
        return [Document(
            page_content="No relevant content found in the uploaded document for this query.",
            metadata={"confidence": 0.0, "no_results": True}
        )]

    # ── Confidence threshold ───────────────────────────────────────────────────
    top_conf = fused[0].metadata.get("confidence", 0.0)
    if top_conf < _CONFIDENCE_THRESHOLD:
        logger.warning(f"[session_retriever] Low confidence ({top_conf:.4f}) for session query: '{query}'")

    return fused[:k]
