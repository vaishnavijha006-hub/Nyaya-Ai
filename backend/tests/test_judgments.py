"""
test_judgments.py — Unit and Regression Test Suite for Landmark Judgments (Phase 11).

Tests:
1. test_maneka()
2. test_kesavananda()
3. test_puttaswamy()
4. test_vishaka()
5. test_shreya()
6. test_case_lookup()
7. test_precedent_query()
8. test_multi_collection_rrf()
"""

import unittest
from app.rag.retriever import retrieve
from app.rag.classifier import classify_query
from app.rag.memory import ConversationMemory


class TestJudgments(unittest.TestCase):

    def test_maneka(self):
        """Verify Maneka Gandhi v. Union of India retrieval accuracy & citations."""
        docs = retrieve("Explain Maneka Gandhi case right to personal liberty", k=3)
        self.assertTrue(len(docs) > 0)
        top_meta = docs[0].metadata
        self.assertIn("Maneka", top_meta.get("case_name", "") or top_meta.get("act_name", ""))
        self.assertGreaterEqual(top_meta.get("confidence", 0.0), 0.25)

    def test_kesavananda(self):
        """Verify Kesavananda Bharati basic structure doctrine retrieval."""
        docs = retrieve("Basic structure doctrine Kesavananda Bharati case", k=3)
        self.assertTrue(len(docs) > 0)
        top_meta = docs[0].metadata
        case_or_act = top_meta.get("case_name", "") or top_meta.get("act_name", "")
        self.assertTrue("Kesavananda" in case_or_act or "Constitution" in case_or_act)

    def test_puttaswamy(self):
        """Verify K.S. Puttaswamy right to privacy retrieval."""
        docs = retrieve("K.S. Puttaswamy landmark judgment right to privacy", k=3)
        self.assertTrue(len(docs) > 0)
        top_meta = docs[0].metadata
        self.assertIn("Puttaswamy", top_meta.get("case_name", "") or top_meta.get("act_name", ""))

    def test_vishaka(self):
        """Verify Vishaka v. State of Rajasthan workplace guidelines retrieval."""
        docs = retrieve("Vishaka case guidelines sexual harassment workplace", k=3)
        self.assertTrue(len(docs) > 0)
        top_meta = docs[0].metadata
        self.assertIn("Vishaka", top_meta.get("case_name", "") or top_meta.get("act_name", ""))

    def test_shreya(self):
        """Verify Shreya Singhal v. Union of India Section 66A IT Act retrieval."""
        docs = retrieve("Shreya Singhal landmark judgment striking down Section 66A", k=3)
        self.assertTrue(len(docs) > 0)
        top_meta = docs[0].metadata
        self.assertTrue("Shreya" in (top_meta.get("case_name", "") or top_meta.get("act_name", "")) or "Information" in top_meta.get("act_name", ""))

    def test_case_lookup(self):
        """Verify classifier correctly categorizes judgment_lookup & case_summary."""
        res1 = classify_query("Tell me about ADM Jabalpur case")
        res1 = classify_query("Explain Kesavananda Bharati case")
        self.assertIn(res1["category"], ["judgment_lookup", "case_summary", "constitutional_interpretation", "exact_case_lookup"])

    def test_precedent_query(self):
        """Verify precedent lookup queries route appropriately."""
        res2 = classify_query("Supreme Court landmark precedent on fundamental rights")
        self.assertTrue(res2.get("is_judgment_query"))
        self.assertIn(res2["category"], ["precedent_lookup", "judgment_lookup", "constitutional_interpretation"])

    def test_multi_collection_rrf(self):
        """Verify dual-collection retrieval fuses Acts and Judgments without crashing."""
        docs = retrieve("Article 21 and Maneka Gandhi case personal liberty", k=5)
        self.assertTrue(len(docs) > 0)
        conf = docs[0].metadata.get("confidence", 0.0)
        self.assertGreaterEqual(conf, 0.40)


if __name__ == "__main__":
    unittest.main()
