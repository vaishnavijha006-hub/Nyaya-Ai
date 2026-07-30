"""
retriever.py — High-Precision Multi-Collection Hybrid Retriever for Nyaya AI.

Features:
1. Multi-Collection RAG Engine (`nyaya_acts` & `nyaya_judgments`).
2. Exact Case-Name & Precedent Matching Boost.
3. RRF & Weighted Hybrid Fusion optimization.
4. Optimized Latency via ThreadPoolExecutor parallel collection querying.
"""

import os
import re
import time
import json
import functools
import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, List, Dict, Any, Tuple

from rank_bm25 import BM25Okapi
from langchain_core.documents import Document
from langchain_chroma import Chroma
from app.rag.embedder import get_embeddings, DB_PATH, COLLECTION_NAME
from app.rag.classifier import classify_query, is_judgment_query, is_act_query

logger = logging.getLogger(__name__)

_BACKEND_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)
_ABS_DB_PATH = os.path.join(_BACKEND_DIR, DB_PATH)
_MANIFEST_PATH = os.path.join(_BACKEND_DIR, "knowledge-base", "manifest.json")

JUDGMENTS_COLLECTION_NAME = "nyaya_judgments"

_HINDI_LEGAL_MAP = {
    r'\bअनुच्छेद\b': 'Article',
    r'\bधारा\b': 'Section',
    r'\bसंविधान\b': 'Constitution',
    r'\bभाग\b': 'Part',
    r'\bअध्याय\b': 'Chapter',
    r'\bअनुसूची\b': 'Schedule',
    r'\bफैसला\b': 'Judgment',
    r'\bमामला\b': 'Case',
}

_CONFIDENCE_THRESHOLD = 0.20


def get_indexed_acts() -> Dict[str, str]:
    """Reads manifest.json to get canonical act_names and case_names currently indexed."""
    if os.path.exists(_MANIFEST_PATH):
        try:
            with open(_MANIFEST_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                docs = data.get("documents", {})
                indexed = {}
                for filename, meta in docs.items():
                    act_name = meta.get("act_name", "") or meta.get("case_name", "")
                    if act_name:
                        indexed[act_name.lower()] = act_name
                return indexed
        except Exception as e:
            logger.warning(f"Error reading manifest in retriever: {e}")
    return {"constitution of india": "Constitution of India"}


def normalize_hindi_legal_terms(query: str) -> str:
    """Normalizes Hindi legal terms for retrieval while preserving original intent."""
    normalized = query
    for pattern, replacement in _HINDI_LEGAL_MAP.items():
        normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)
    return normalized


@functools.lru_cache(maxsize=2)
def _get_db(collection_name: str = COLLECTION_NAME) -> Chroma:
    """Load and cache Chroma vector stores for Acts and Judgments."""
    return Chroma(
        persist_directory=_ABS_DB_PATH,
        embedding_function=get_embeddings(),
        collection_name=collection_name,
    )


def _tokenize(text: str) -> List[str]:
    """Tokenization function for BM25 indexing and querying."""
    return re.findall(r'\w+', text.lower())


@functools.lru_cache(maxsize=2)
def _get_bm25_index(collection_name: str = COLLECTION_NAME):
    """Build and cache BM25 index over vector DB documents for a given collection."""
    db = _get_db(collection_name)
    data = db.get()
    
    ids = data.get("ids", [])
    texts = data.get("documents", [])
    metadatas = data.get("metadatas", [])
    
    documents = []
    corpus = []
    
    for i, txt in enumerate(texts):
        meta = metadatas[i] if i < len(metadatas) else {}
        meta["chunk_id"] = ids[i] if i < len(ids) else f"chunk_{i}"
        doc = Document(page_content=txt, metadata=meta)
        documents.append(doc)
        corpus.append(_tokenize(txt))
        
    if not corpus:
        corpus = [["empty"]]
        documents = [Document(page_content="", metadata={})]

    bm25 = BM25Okapi(corpus)
    return bm25, documents


def bm25_search(query: str, k: int = 15, collection_name: str = COLLECTION_NAME) -> List[Document]:
    """Execute sparse BM25 lexical keyword search on specific collection."""
    bm25, documents = _get_bm25_index(collection_name)
    tokens = _tokenize(query)
    if not tokens or not documents:
        return []
    
    scores = bm25.get_scores(tokens)
    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]
    
    results = []
    for idx in top_indices:
        if scores[idx] > 0 and idx < len(documents) and documents[idx].page_content:
            doc = Document(
                page_content=documents[idx].page_content,
                metadata=documents[idx].metadata.copy()
            )
            doc.metadata["bm25_score"] = round(float(scores[idx]), 4)
            results.append(doc)
            
    return results


def weighted_hybrid_fusion(
    dense_results: List[Tuple[Document, float]],
    bm25_results: List[Document],
    target_meta: Dict[str, Any],
    top_k: int = 10,
    w_vec: float = 0.35,
    w_bm25: float = 0.35,
    w_meta: float = 0.30
) -> List[Document]:
    """
    Weighted Hybrid Fusion with Case-Name, Topic, and Metadata Boosting.
    """
    doc_map: Dict[str, Document] = {}
    vec_scores: Dict[str, float] = {}
    bm25_scores: Dict[str, float] = {}
    meta_scores: Dict[str, float] = {}

    for doc, sim in dense_results:
        cid = doc.metadata.get("chunk_id", doc.page_content[:100])
        doc_map[cid] = doc
        vec_scores[cid] = max(0.0, float(sim))

    max_bm25 = max([doc.metadata.get("bm25_score", 0.0) for doc in bm25_results], default=1.0)
    if max_bm25 <= 0:
        max_bm25 = 1.0
    for doc in bm25_results:
        cid = doc.metadata.get("chunk_id", doc.page_content[:100])
        if cid not in doc_map:
            doc_map[cid] = doc
        raw_bm25 = float(doc.metadata.get("bm25_score", 0.0))
        bm25_scores[cid] = min(1.0, raw_bm25 / max_bm25)

    target_case = str(target_meta.get("case_name", "")).lower()
    target_act = str(target_meta.get("act_name", "")).lower()
    target_art = str(target_meta.get("article", "")).upper()
    target_sec = str(target_meta.get("section", "")).upper()

    for cid, doc in doc_map.items():
        m = doc.metadata
        c_name = str(m.get("case_name", "")).lower()
        a_name = str(m.get("act_name", "")).lower()
        title = str(m.get("title", "")).lower()
        source = str(m.get("source", "")).lower()
        topics = str(m.get("legal_topics", "")).lower()

        score = 0.0

        # Exact case name / keyword match boost
        if target_case:
            tc_clean = target_case.lower()
            tc_words = [w for w in re.split(r'\W+', tc_clean) if len(w) > 3 and w not in ('union', 'india', 'state', 'kerala', 'punjab', 'rajasthan', 'retd')]
            
            if tc_clean in c_name or tc_clean in title:
                score += 1.0
            elif any(w in c_name or w in title or w in source for w in tc_words):
                score += 0.95
            elif any(w in doc.page_content.lower() for w in tc_words):
                score += 0.60

        # Exact act match boost
        if target_act and target_act in a_name:
            score += 0.80

        # Section / Article match boost
        if target_art and (target_art == str(m.get("article", "")).upper() or target_art == str(m.get("primary_article", "")).upper()):
            score += 0.90
        if target_sec and target_sec == str(m.get("section", "")).upper():
            score += 0.90

        meta_scores[cid] = min(1.0, score)

    fused_docs = []
    for cid, doc in doc_map.items():
        v_s = vec_scores.get(cid, 0.0)
        b_s = bm25_scores.get(cid, 0.0)
        m_s = meta_scores.get(cid, 0.0)

        final_conf = (w_vec * v_s) + (w_bm25 * b_s) + (w_meta * m_s)

        doc.metadata["vector_score"] = round(v_s, 4)
        doc.metadata["bm25_norm_score"] = round(b_s, 4)
        doc.metadata["metadata_score"] = round(m_s, 4)
        doc.metadata["fusion_score"] = round(final_conf, 4)
        doc.metadata["confidence"] = round(final_conf, 4)

        fused_docs.append(doc)

    fused_docs.sort(key=lambda d: d.metadata.get("confidence", 0.0), reverse=True)
    return fused_docs[:top_k]


def reciprocal_rank_fusion(
    acts_results: List[Document],
    judgments_results: List[Document],
    classification: Dict[str, Any],
    c: int = 60,
    top_k: int = 10
) -> List[Document]:
    """
    RRF across Acts and Judgments with Query Intent Bias.
    """
    target_case = classification.get("target_judgment")
    target_act = classification.get("target_act")
    has_judgment_kw = classification.get("is_judgment_query", False)
    category = classification.get("category", "")

    # Calculate collection priority bias
    act_weight = 1.0
    judgment_weight = 1.0

    if target_case or category in ("exact_case_lookup", "judgment_lookup", "case_summary", "case_comparison"):
        judgment_weight = 2.5
        act_weight = 0.5
    elif target_act or category in ("exact_article_lookup", "exact_section_lookup"):
        act_weight = 2.5
        judgment_weight = 0.5

    rrf_scores: Dict[str, float] = {}
    doc_map: Dict[str, Document] = {}

    for rank, doc in enumerate(acts_results):
        cid = doc.metadata.get("chunk_id", doc.page_content[:100])
        doc_map[cid] = doc
        rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (act_weight / (c + rank + 1))

    for rank, doc in enumerate(judgments_results):
        cid = doc.metadata.get("chunk_id", doc.page_content[:100])
        doc_map[cid] = doc
        rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (judgment_weight / (c + rank + 1))

    max_rrf = max(rrf_scores.values()) if rrf_scores else 1.0
    fused = []
    for cid, doc in doc_map.items():
        norm_rrf = rrf_scores[cid] / max_rrf if max_rrf > 0 else 0.0
        base_conf = doc.metadata.get("confidence", 0.50)
        doc.metadata["confidence"] = round(max(base_conf, norm_rrf), 4)
        doc.metadata["rrf_score"] = round(norm_rrf, 4)
        fused.append(doc)

    fused.sort(key=lambda d: d.metadata.get("confidence", 0.0), reverse=True)
    return fused[:top_k]


def _single_collection_retrieve(
    query: str,
    collection_name: str,
    extracted_meta: Dict[str, Any],
    retrieval_query: str,
    k: int = 6
) -> List[Document]:
    """Executes hybrid retrieval over a single Chroma collection."""
    db = _get_db(collection_name)

    try:
        matched_raw = db.similarity_search_with_relevance_scores(retrieval_query, k=15)
        dense_candidates = [(doc, float(score)) for doc, score in matched_raw]
    except Exception as e:
        logger.error(f"Dense vector search failed for {collection_name}: {e}")
        dense_candidates = []

    try:
        bm25_candidates = bm25_search(retrieval_query, k=15, collection_name=collection_name)
    except Exception as e:
        logger.error(f"BM25 search failed for {collection_name}: {e}")
        bm25_candidates = []

    return weighted_hybrid_fusion(dense_candidates, bm25_candidates, extracted_meta, top_k=k)


def retrieve(
    query: str,
    k: int = 6,
    filter_dict: Optional[Dict[str, Any]] = None,
    debug: bool = False,
    conversation_context: Optional[str] = None,
) -> list:
    """
    Multi-Collection Dual-Pipeline (Acts + Judgments) Parallel RAG Engine.
    """
    t_start = time.time()

    classification = classify_query(query)
    lang = classification["language"]
    category = classification["category"]
    extracted_meta = classification["metadata"]
    target_act = classification.get("target_act")
    target_judgment = classification.get("target_judgment")
    has_judgment_kw = classification.get("is_judgment_query", False)
    has_act_kw = is_act_query(query)

    if filter_dict:
        extracted_meta.update(filter_dict)

    normalized_query = normalize_hindi_legal_terms(query)
    retrieval_query = f"{normalized_query} {conversation_context.strip()}" if conversation_context and conversation_context.strip() else normalized_query

    results_acts: List[Document] = []
    results_judgments: List[Document] = []

    search_acts = not target_judgment and (not has_judgment_kw or has_act_kw)
    search_judgments = bool(target_judgment or has_judgment_kw or not has_act_kw)

    # Parallel retrieval execution for low latency (<500ms)
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_acts = executor.submit(
            _single_collection_retrieve, query, COLLECTION_NAME, extracted_meta, retrieval_query, k
        ) if search_acts else None

        future_judgments = executor.submit(
            _single_collection_retrieve, query, JUDGMENTS_COLLECTION_NAME, extracted_meta, retrieval_query, k
        ) if search_judgments else None

        if future_acts:
            results_acts = future_acts.result()
        if future_judgments:
            results_judgments = future_judgments.result()

    if results_acts and results_judgments:
        final_results = reciprocal_rank_fusion(results_acts, results_judgments, classification, top_k=k)
    elif results_judgments:
        final_results = results_judgments[:k]
    else:
        final_results = results_acts[:k]

    t_total = time.time() - t_start

    if final_results:
        top_conf = final_results[0].metadata.get("confidence", 0.0)
        if top_conf < _CONFIDENCE_THRESHOLD:
            logger.warning(f"Low confidence ({top_conf:.4f} < {_CONFIDENCE_THRESHOLD}) for query: '{query}'")
            fallback_doc = Document(
                page_content="I couldn't find sufficient evidence in the indexed legal documents or judgments.",
                metadata={"confidence": top_conf, "low_confidence_fallback": True}
            )
            return [fallback_doc]

    if debug:
        trace = {
            "query": query,
            "normalized_query": normalized_query,
            "category": category,
            "target_judgment": target_judgment,
            "target_act": target_act,
            "search_acts": search_acts,
            "search_judgments": search_judgments,
            "total_latency_ms": round(t_total * 1000, 2),
            "top_confidence": final_results[0].metadata.get("confidence", 0.0) if final_results else 0.0
        }
        for doc in final_results:
            doc.metadata["debug_trace"] = trace

    return final_results