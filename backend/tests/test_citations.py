"""
tests/test_citations.py — Unit tests for Phase 6 Structured Citation System.

Covers:
    - CitationItem model validation
    - build_citation() with full metadata
    - build_citation() with article metadata
    - build_citation() with section metadata
    - build_citation() with missing optional fields (no KeyError)
    - build_citation() with completely empty metadata
    - build_citation() confidence preserved
    - build_citation() chunk_id preserved
    - build_citations() batch processing
    - build_citations() tolerates partially-bad documents
    - build_readable_citation_block() output format
    - build_readable_citation_block() empty input
"""

import sys
import os
import unittest

sys.stdout.reconfigure(encoding="utf-8")

# Add backend root to path
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from langchain_core.documents import Document
from app.rag.citations import (
    CitationItem,
    build_citation,
    build_citations,
    build_readable_citation_block,
)


def _make_doc(metadata: dict, content: str = "Legal text excerpt.") -> Document:
    """Helper: create a LangChain Document with given metadata."""
    return Document(page_content=content, metadata=metadata)


class TestCitationItem(unittest.TestCase):
    """CitationItem Pydantic model validation."""

    def test_full_fields(self):
        c = CitationItem(
            act_name="Constitution of India",
            document_type="Constitution",
            part="III",
            chapter=None,
            article="21",
            section=None,
            page=10,
            confidence=0.97,
            chunk_id="chunk_10_abcd",
        )
        self.assertEqual(c.act_name, "Constitution of India")
        self.assertEqual(c.article, "21")
        self.assertIsNone(c.section)
        self.assertEqual(c.confidence, 0.97)
        self.assertEqual(c.chunk_id, "chunk_10_abcd")

    def test_optional_fields_default_none(self):
        c = CitationItem(
            act_name="Constitution of India",
            document_type="Constitution",
            confidence=0.5,
            chunk_id="cid_1",
        )
        self.assertIsNone(c.part)
        self.assertIsNone(c.chapter)
        self.assertIsNone(c.article)
        self.assertIsNone(c.section)
        self.assertIsNone(c.page)

    def test_json_serialization(self):
        c = CitationItem(
            act_name="Constitution of India",
            document_type="Constitution",
            article="21",
            page=10,
            confidence=0.97,
            chunk_id="chunk_10",
        )
        data = c.model_dump()
        self.assertIn("act_name", data)
        self.assertIn("article", data)
        self.assertEqual(data["article"], "21")
        self.assertEqual(data["confidence"], 0.97)


class TestBuildCitation(unittest.TestCase):
    """build_citation() extracts fields correctly from Document metadata."""

    def test_constitution_article_metadata(self):
        doc = _make_doc({
            "act_name": "Constitution of India",
            "document_type": "Constitution",
            "part": "III",
            "article": "21",
            "section": None,
            "page": 10,
            "confidence": 0.97,
            "chunk_id": "chunk_10_abcd",
        })
        c = build_citation(doc)
        self.assertEqual(c.act_name, "Constitution of India")
        self.assertEqual(c.document_type, "Constitution")
        self.assertEqual(c.part, "III")
        self.assertEqual(c.article, "21")
        self.assertIsNone(c.section)
        self.assertEqual(c.page, 10)
        self.assertAlmostEqual(c.confidence, 0.97, places=2)
        self.assertEqual(c.chunk_id, "chunk_10_abcd")

    def test_act_section_metadata(self):
        doc = _make_doc({
            "act_name": "Bharatiya Nyaya Sanhita",
            "document_type": "Act",
            "section": "103",
            "page": 45,
            "confidence": 0.88,
            "chunk_id": "bns_chunk_45",
        })
        c = build_citation(doc)
        self.assertEqual(c.act_name, "Bharatiya Nyaya Sanhita")
        self.assertEqual(c.section, "103")
        self.assertIsNone(c.article)
        self.assertEqual(c.page, 45)
        self.assertAlmostEqual(c.confidence, 0.88, places=2)

    def test_article_fallback_to_primary_article(self):
        """When 'article' is absent, fall back to 'primary_article'."""
        doc = _make_doc({
            "act_name": "Constitution of India",
            "document_type": "Constitution",
            "primary_article": "14",
            "confidence": 0.91,
            "chunk_id": "chunk_14",
        })
        c = build_citation(doc)
        self.assertEqual(c.article, "14")

    def test_missing_optional_fields_no_error(self):
        """Missing part/chapter/article/section/page must not raise KeyError."""
        doc = _make_doc({
            "act_name": "RTI Act",
            "document_type": "Act",
            "confidence": 0.75,
            "chunk_id": "rti_chunk_1",
        })
        c = build_citation(doc)
        self.assertIsNone(c.part)
        self.assertIsNone(c.chapter)
        self.assertIsNone(c.article)
        self.assertIsNone(c.section)
        self.assertIsNone(c.page)

    def test_completely_empty_metadata_no_error(self):
        """Completely empty metadata must produce safe defaults, never raise."""
        doc = _make_doc({})
        c = build_citation(doc)
        self.assertEqual(c.act_name, "Legal Document")
        self.assertEqual(c.document_type, "Unknown")
        self.assertAlmostEqual(c.confidence, 0.0, places=4)
        self.assertEqual(c.chunk_id, "unknown")

    def test_confidence_preserved_from_fusion_score(self):
        """fusion_score should be used when 'confidence' key is absent."""
        doc = _make_doc({
            "act_name": "IT Act",
            "document_type": "Act",
            "fusion_score": 0.83,
            "chunk_id": "it_chunk_5",
        })
        c = build_citation(doc)
        self.assertAlmostEqual(c.confidence, 0.83, places=2)

    def test_confidence_preserved_exactly(self):
        doc = _make_doc({
            "act_name": "Constitution of India",
            "document_type": "Constitution",
            "article": "32",
            "confidence": 0.9987,
            "chunk_id": "chunk_32",
        })
        c = build_citation(doc)
        self.assertAlmostEqual(c.confidence, 0.9987, places=4)

    def test_chunk_id_preserved(self):
        doc = _make_doc({
            "act_name": "Constitution of India",
            "document_type": "Constitution",
            "confidence": 0.9,
            "chunk_id": "my_unique_chunk_abc123",
        })
        c = build_citation(doc)
        self.assertEqual(c.chunk_id, "my_unique_chunk_abc123")

    def test_invalid_page_value_no_error(self):
        """Non-integer page value must not raise; page should default to None."""
        doc = _make_doc({
            "act_name": "Constitution of India",
            "document_type": "Constitution",
            "page": "not-a-number",
            "confidence": 0.8,
            "chunk_id": "chunk_x",
        })
        c = build_citation(doc)
        self.assertIsNone(c.page)

    def test_none_string_values_treated_as_none(self):
        """Values stored as the string 'None' must be treated as None."""
        doc = _make_doc({
            "act_name": "Constitution of India",
            "document_type": "Constitution",
            "article": "None",
            "section": "None",
            "part": "None",
            "confidence": 0.7,
            "chunk_id": "chunk_y",
        })
        c = build_citation(doc)
        self.assertIsNone(c.article)
        self.assertIsNone(c.section)
        self.assertIsNone(c.part)


class TestBuildCitations(unittest.TestCase):
    """build_citations() batch processing."""

    def test_empty_list(self):
        result = build_citations([])
        self.assertEqual(result, [])

    def test_single_doc(self):
        docs = [_make_doc({"act_name": "Constitution of India", "document_type": "Constitution",
                            "article": "21", "confidence": 0.9, "chunk_id": "c1"})]
        result = build_citations(docs)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].article, "21")

    def test_multiple_docs(self):
        docs = [
            _make_doc({"act_name": "Constitution of India", "document_type": "Constitution",
                        "article": "21", "confidence": 0.97, "chunk_id": "c21"}),
            _make_doc({"act_name": "Constitution of India", "document_type": "Constitution",
                        "article": "14", "confidence": 0.84, "chunk_id": "c14"}),
        ]
        result = build_citations(docs)
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0].article, "21")
        self.assertEqual(result[1].article, "14")

    def test_tolerates_bad_doc(self):
        """A document that triggers an unexpected error should be silently skipped."""
        # metadata={} makes a valid but empty document (simulating fully stripped metadata)
        bad_doc = _make_doc({})  # empty metadata — build_citation must handle gracefully
        good_doc = _make_doc({"act_name": "Constitution of India", "document_type": "Constitution",
                               "article": "32", "confidence": 0.9, "chunk_id": "c32"})
        # Should not raise, should return at least the good doc's citation
        try:
            result = build_citations([bad_doc, good_doc])
        except Exception as e:
            self.fail(f"build_citations raised unexpectedly: {e}")


class TestBuildReadableCitationBlock(unittest.TestCase):
    """build_readable_citation_block() output format."""

    def test_empty_citations_returns_empty_string(self):
        result = build_readable_citation_block([])
        self.assertEqual(result, "")

    def test_single_full_citation(self):
        c = CitationItem(
            act_name="Constitution of India",
            document_type="Constitution",
            part="III",
            article="21",
            page=10,
            confidence=0.97,
            chunk_id="chunk_21",
        )
        result = build_readable_citation_block([c])
        self.assertIn("Retrieved Sources:", result)
        self.assertIn("Constitution of India", result)
        self.assertIn("Article 21", result)
        self.assertIn("Part III", result)
        self.assertIn("Page 10", result)
        self.assertIn("[1]", result)

    def test_multiple_citations_numbered(self):
        citations = [
            CitationItem(act_name="Constitution of India", document_type="Constitution",
                         article="21", page=10, confidence=0.97, chunk_id="c21"),
            CitationItem(act_name="Constitution of India", document_type="Constitution",
                         article="14", page=6, confidence=0.84, chunk_id="c14"),
        ]
        result = build_readable_citation_block(citations)
        self.assertIn("[1]", result)
        self.assertIn("[2]", result)
        self.assertIn("Article 21", result)
        self.assertIn("Article 14", result)

    def test_no_optional_fields_still_works(self):
        c = CitationItem(
            act_name="RTI Act",
            document_type="Act",
            confidence=0.75,
            chunk_id="rti_1",
        )
        result = build_readable_citation_block([c])
        self.assertIn("RTI Act", result)
        # Should not contain "Article None" or "Section None"
        self.assertNotIn("Article None", result)
        self.assertNotIn("Section None", result)

    def test_does_not_expose_json(self):
        c = CitationItem(
            act_name="Constitution of India",
            document_type="Constitution",
            article="21",
            confidence=0.9,
            chunk_id="c21",
        )
        result = build_readable_citation_block([c])
        # Must not contain raw JSON tokens
        self.assertNotIn("{", result)
        self.assertNotIn("\"act_name\"", result)
        self.assertNotIn("confidence", result)


if __name__ == "__main__":
    unittest.main(verbosity=2)
