"""
test_regression.py — Test suite ensuring critical legal articles are retrieved with 100% accuracy.
"""

import sys
import os
import unittest

sys.stdout.reconfigure(encoding='utf-8')

backend_dir = r"c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.rag.retriever import retrieve


class TestNyayaAIRegression(unittest.TestCase):

    def test_article_14_retrieval(self):
        res = retrieve("Article 14", k=1)
        self.assertTrue(len(res) > 0)
        top_doc = res[0]
        self.assertIn("14", top_doc.page_content)

    def test_article_19_retrieval(self):
        res = retrieve("Article 19", k=1)
        self.assertTrue(len(res) > 0)
        top_doc = res[0]
        self.assertIn("19", top_doc.page_content)

    def test_article_21_retrieval(self):
        res = retrieve("Article 21", k=1)
        self.assertTrue(len(res) > 0)
        top_doc = res[0]
        self.assertIn("21", top_doc.page_content)

    def test_article_32_retrieval(self):
        res = retrieve("Article 32", k=1)
        self.assertTrue(len(res) > 0)
        top_doc = res[0]
        self.assertIn("32", top_doc.page_content)

    def test_article_51a_retrieval(self):
        res = retrieve("Fundamental Duties Article 51A", k=1)
        self.assertTrue(len(res) > 0)
        top_doc = res[0]
        self.assertIn("51A", top_doc.page_content)

    def test_hindi_article_21_retrieval(self):
        res = retrieve("अनुच्छेद 21", k=1)
        self.assertTrue(len(res) > 0)
        top_doc = res[0]
        self.assertIn("21", top_doc.page_content)


if __name__ == "__main__":
    unittest.main()
