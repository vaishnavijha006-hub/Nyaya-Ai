"""
scratch/run_judgment_eval.py — 30-Query Benchmark Evaluation Suite for Phase 11.

Evaluates:
- Judgment Top-1 Accuracy
- Judgment Top-3 Accuracy
- Mean Reciprocal Rank (MRR)
- Average Retrieval Latency (ms)
across 30 diverse judgment & legal queries.
"""

import sys
import os
import time
import logging
from typing import List, Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.rag.retriever import retrieve

logging.basicConfig(level=logging.ERROR)

EVAL_BENCHMARK_QUERIES_30 = [
    # A. Exact case lookup
    {"query": "Explain Kesavananda Bharati case", "expected": "Kesavananda Bharati"},
    {"query": "Explain Maneka Gandhi", "expected": "Maneka Gandhi"},
    {"query": "Explain Puttaswamy", "expected": "K.S. Puttaswamy"},
    {"query": "Explain Vishaka guidelines", "expected": "Vishaka"},
    {"query": "Explain Shreya Singhal", "expected": "Shreya Singhal"},
    {"query": "Explain S.R. Bommai", "expected": "S.R. Bommai"},
    {"query": "Explain Indra Sawhney", "expected": "Indra Sawhney"},
    {"query": "Explain Minerva Mills", "expected": "Minerva Mills"},
    {"query": "Explain Golaknath", "expected": "Golaknath"},
    {"query": "Explain ADM Jabalpur", "expected": "ADM Jabalpur"},

    # B. Case-name variations & details
    {"query": "What happened in Maneka Gandhi case?", "expected": "Maneka Gandhi"},
    {"query": "What was held in Kesavananda Bharati?", "expected": "Kesavananda Bharati"},
    {"query": "What is the significance of ADM Jabalpur case?", "expected": "ADM Jabalpur"},

    # C. Topic & Landmark Precedent queries
    {"query": "What is the Basic Structure Doctrine?", "expected": "Kesavananda Bharati"},
    {"query": "Which case established the Basic Structure Doctrine?", "expected": "Kesavananda Bharati"},
    {"query": "Which judgment recognized privacy as a fundamental right?", "expected": "K.S. Puttaswamy"},
    {"query": "Which case dealt with workplace sexual harassment?", "expected": "Vishaka"},
    {"query": "Which judgment struck down Section 66A of IT Act?", "expected": "Shreya Singhal"},
    {"query": "Which case established principles concerning President's Rule under Article 356?", "expected": "S.R. Bommai"},
    {"query": "Which judgment deals with 50 percent reservation ceiling cap?", "expected": "Indra Sawhney"},

    # D. Article & Section based judgment queries
    {"query": "Which judgment expanded Article 21 to include procedure established by law?", "expected": "Maneka Gandhi"},
    {"query": "Which judgment concerns freedom of speech under Section 66A IT Act?", "expected": "Shreya Singhal"},
    {"query": "Which landmark judgment is associated with Article 368 amendment power?", "expected": "Kesavananda Bharati"},
    {"query": "Habeas corpus during emergency Article 359 case", "expected": "ADM Jabalpur"},

    # E. Case Comparison queries
    {"query": "Compare Golaknath and Kesavananda Bharati", "expected": "Kesavananda Bharati"},
    {"query": "Compare Maneka Gandhi and Puttaswamy", "expected": "Maneka Gandhi"},

    # F. Act Queries (Verification for zero regression)
    {"query": "What is Article 21 of the Constitution?", "expected": "Constitution of India"},
    {"query": "Section 103 BNS punishment for murder", "expected": "Bharatiya Nyaya Sanhita"},
    {"query": "Section 173 BNSS report of investigation", "expected": "Bharatiya Nagarik Suraksha Sanhita"},
    {"query": "Section 66A IT Act text", "expected": "Information Technology Act"},
]


def run_evaluation():
    print("=" * 70)
    print("Nyaya AI — Phase 11 Expanded 30-Query Benchmark Evaluation Engine")
    print("=" * 70)

    top1_hits = 0
    top3_hits = 0
    mrr_sum = 0.0
    latencies_ms: List[float] = []

    results = []

    for item in EVAL_BENCHMARK_QUERIES_30:
        q = item["query"]
        expected = item["expected"].lower()

        t0 = time.time()
        docs = retrieve(q, k=3)
        latency = (time.time() - t0) * 1000
        latencies_ms.append(latency)

        hit_rank = 0
        for rank, doc in enumerate(docs, start=1):
            meta = doc.metadata
            c_name = str(meta.get("case_name", "")).lower()
            a_name = str(meta.get("act_name", "")).lower()
            title = str(meta.get("title", "")).lower()

            if expected in c_name or expected in a_name or expected in title or (expected == "constitution of india" and "constitution" in a_name):
                hit_rank = rank
                break

        if hit_rank == 1:
            top1_hits += 1
            top3_hits += 1
            mrr_sum += 1.0
        elif hit_rank in (2, 3):
            top3_hits += 1
            mrr_sum += (1.0 / hit_rank)

        top_doc_name = docs[0].metadata.get("case_name") or docs[0].metadata.get("act_name") if docs else "None"

        results.append({
            "query": q,
            "expected": item["expected"],
            "hit_rank": hit_rank if hit_rank > 0 else "Miss",
            "latency_ms": round(latency, 2),
            "top_doc": top_doc_name
        })

    total = len(EVAL_BENCHMARK_QUERIES_30)
    top1_acc = round((top1_hits / total) * 100, 2)
    top3_acc = round((top3_hits / total) * 100, 2)
    mrr = round(mrr_sum / total, 4)
    avg_latency = round(sum(latencies_ms) / len(latencies_ms), 2)

    print(f"\nBenchmark Metrics Summary:")
    print(f"Total Queries Evaluated: {total}")
    print(f"Top-1 Accuracy:          {top1_acc}%  (Target >= 80%)")
    print(f"Top-3 Accuracy:          {top3_acc}%  (Target >= 90%)")
    print(f"Mean Reciprocal Rank:    {mrr}    (Target >= 0.80)")
    print(f"Average Latency:         {avg_latency} ms  (Target < 500 ms)")
    print("-" * 70)

    for idx, res in enumerate(results, start=1):
        status_icon = "[PASS]" if res['hit_rank'] == 1 else ("[TOP3]" if res['hit_rank'] in (2, 3) else "[MISS]")
        print(f"{status_icon} [{idx:02d}] Rank: {str(res['hit_rank']):<4} | {res['latency_ms']:>6.2f}ms | Q: '{res['query']:<55}' -> Found: {res['top_doc']}")

    print("=" * 70)
    return {
        "total": total,
        "top1_acc": top1_acc,
        "top3_acc": top3_acc,
        "mrr": mrr,
        "avg_latency": avg_latency
    }


if __name__ == "__main__":
    run_evaluation()
