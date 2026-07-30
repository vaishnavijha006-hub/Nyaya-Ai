"""
test_hybrid_search.py — Evaluation & Comparative Benchmark Script for True Hybrid Search.

Compares:
1. Dense Vector Search (ChromaDB + BAAI/bge-small-en-v1.5)
2. Sparse BM25 Keyword Search (rank_bm25)
3. Reciprocal Rank Fusion (RRF) Hybrid Search
"""

import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.rag.retriever import _get_db, bm25_search, retrieve, reciprocal_rank_fusion

TEST_QUERIES = [
    "Article 21",
    "Right to Equality",
    "Section 138",
    "Mens rea",
    "Audi alteram partem",
    "Consumer Protection Act",
]


def run_benchmark():
    print("=" * 80)
    print("Nyaya AI — True Hybrid Search Benchmark (BM25 + Dense + RRF)")
    print("=" * 80)

    db = _get_db()

    for q in TEST_QUERIES:
        print(f"\nQUERY: '{q}'")
        print("-" * 60)

        # 1. Dense Only
        t0 = time.perf_counter()
        dense_docs = db.similarity_search(q, k=3)
        t_dense = (time.perf_counter() - t0) * 1000

        print(f"--- Dense Vector Search ({t_dense:.2f} ms):")
        for i, d in enumerate(dense_docs):
            art = d.metadata.get("primary_article", "?")
            src = d.metadata.get("source", "?")
            snippet = repr(d.page_content[:120])
            print(f"   [{i+1}] Article={art} | Source={src} | {snippet}")

        # 2. BM25 Only
        t0 = time.perf_counter()
        bm25_docs = bm25_search(q, k=3)
        t_bm25 = (time.perf_counter() - t0) * 1000

        print(f"--- BM25 Keyword Search ({t_bm25:.2f} ms):")
        for i, d in enumerate(bm25_docs):
            score = d.metadata.get("bm25_score", 0.0)
            art = d.metadata.get("primary_article", "?")
            snippet = repr(d.page_content[:120])
            print(f"   [{i+1}] Score={score} | Article={art} | {snippet}")

        # 3. Final Fused RRF Hybrid
        t0 = time.perf_counter()
        hybrid_docs = retrieve(q, k=3)
        t_hybrid = (time.perf_counter() - t0) * 1000

        print(f"--- Final Fused RRF Hybrid ({t_hybrid:.2f} ms):")
        for i, d in enumerate(hybrid_docs):
            rrf_s = d.metadata.get("rrf_score", 0.0)
            art = d.metadata.get("primary_article", "?")
            src = d.metadata.get("source", "?")
            snippet = repr(d.page_content[:120])
            print(f"   [{i+1}] RRF_Score={rrf_s} | Article={art} | Source={src} | {snippet}")

    print("\n" + "=" * 80)
    print("Benchmark Completed Successfully.")
    print("=" * 80)


if __name__ == "__main__":
    run_benchmark()

