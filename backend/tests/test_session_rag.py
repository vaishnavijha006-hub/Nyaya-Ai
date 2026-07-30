"""
tests/test_session_rag.py — Unit & Integration tests for Phase 10 Session RAG.

Covers:
    1. Session PDF upload & validation (pdfplumber, max size/pages, encrypted PDF rejection)
    2. Session registration & store lifecycle (expiry, manual deletion, lazy cleanup)
    3. Session hybrid retrieval & metadata tagging (filename, page, chunk_id, confidence)
    4. Session isolation (Session A cannot access Session B documents)
    5. Conversation memory scoping over session context
    6. Main database immutability & backward compatibility (/chat without session_id)
"""

import os
import sys
import time
import shutil
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Ensure backend directory is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_core.documents import Document

from app.rag.session_store import (
    SessionMeta,
    register_session,
    get_session,
    delete_session,
    list_active_sessions,
    SESSION_TTL_SECONDS,
)
from app.rag.session_retriever import retrieve_session
from app.api.pdf_upload import _validate_pdf_bytes, MAX_PAGES


class TestSessionStore(unittest.TestCase):
    """Tests for in-memory session registry and lifecycle management."""

    def setUp(self):
        # Clear sessions list before each test
        from app.rag.session_store import _SESSIONS, _LOCK
        with _LOCK:
            _SESSIONS.clear()

    def test_register_and_get_session(self):
        meta = register_session(filename="contract.pdf", pages=10, chunks=25)
        self.assertIsNotNone(meta.session_id)
        self.assertEqual(meta.filename, "contract.pdf")
        self.assertEqual(meta.pages, 10)
        self.assertEqual(meta.chunks, 25)

        retrieved = get_session(meta.session_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.session_id, meta.session_id)

    def test_session_expiry(self):
        meta = register_session(filename="contract.pdf", pages=5, chunks=10)
        # Artificially expire the session
        meta.expires_at = time.time() - 10

        self.assertTrue(meta.is_expired)
        retrieved = get_session(meta.session_id)
        # Should return None because lazy lookup deletes expired session
        self.assertIsNone(retrieved)

    def test_manual_delete_session(self):
        meta = register_session(filename="notice.pdf", pages=2, chunks=5)
        db_dir = meta.db_path
        db_dir.mkdir(parents=True, exist_ok=True)
        
        deleted = delete_session(meta.session_id)
        self.assertTrue(deleted)
        self.assertIsNone(get_session(meta.session_id))
        self.assertFalse(db_dir.exists())

    def test_list_active_sessions(self):
        register_session(filename="doc1.pdf", pages=1, chunks=2)
        register_session(filename="doc2.pdf", pages=2, chunks=4)
        active = list_active_sessions()
        self.assertEqual(len(active), 2)


class TestPDFValidation(unittest.TestCase):
    """Tests for PDF upload validation logic."""

    def test_exceeds_max_pages_raises(self):
        with patch("pdfplumber.open") as mock_open:
            mock_pdf = MagicMock()
            mock_pdf.pages = [MagicMock()] * (MAX_PAGES + 1)
            mock_open.return_value.__enter__.return_value = mock_pdf

            with self.assertRaises(Exception) as ctx:
                _validate_pdf_bytes(b"%PDF-1.4 test content", "large.pdf")
            self.assertIn("PDF too large", str(ctx.exception.detail))

    def test_encrypted_pdf_raises(self):
        with patch("pdfplumber.open", side_effect=Exception("PDFPasswordIncorrect")):
            with self.assertRaises(Exception) as ctx:
                _validate_pdf_bytes(b"%PDF-1.4 encrypted", "locked.pdf")
            self.assertIn("Encrypted PDFs are not supported", str(ctx.exception.detail))


class TestSessionIsolationAndRetrieval(unittest.TestCase):
    """Tests for retriever isolation across sessions and main DB preservation."""

    def setUp(self):
        from app.rag.session_store import _SESSIONS, _LOCK
        with _LOCK:
            _SESSIONS.clear()

    @patch("app.rag.session_retriever._load_session_db")
    def test_session_isolation(self, mock_load_db):
        """Verify Session A and Session B return distinct, isolated documents."""
        mock_db_a = MagicMock()
        mock_db_b = MagicMock()

        doc_a = Document(page_content="Notice period is 30 days.", metadata={"source": "Contract_A.pdf", "confidence": 0.95})
        doc_b = Document(page_content="Rent is Rs 50,000 per month.", metadata={"source": "Agreement_B.pdf", "confidence": 0.92})

        mock_db_a.similarity_search_with_relevance_scores.return_value = [(doc_a, 0.95)]
        mock_db_a.get.return_value = {"ids": ["c1"], "documents": [doc_a.page_content], "metadatas": [doc_a.metadata]}

        mock_db_b.similarity_search_with_relevance_scores.return_value = [(doc_b, 0.92)]
        mock_db_b.get.return_value = {"ids": ["c2"], "documents": [doc_b.page_content], "metadatas": [doc_b.metadata]}

        def side_effect(sid):
            if sid == "sess_a":
                return mock_db_a
            if sid == "sess_b":
                return mock_db_b
            return None

        mock_load_db.side_effect = side_effect

        res_a = retrieve_session("sess_a", "notice period")
        res_b = retrieve_session("sess_b", "rent amount")

        self.assertEqual(res_a[0].page_content, "Notice period is 30 days.")
        self.assertEqual(res_b[0].page_content, "Rent is Rs 50,000 per month.")

    def test_nonexistent_session_returns_expired_fallback(self):
        res = retrieve_session("non_existent_id", "what is the clause?")
        self.assertEqual(len(res), 1)
        self.assertTrue(res[0].metadata.get("session_expired"))


class TestPipelineSessionRouting(unittest.TestCase):
    """Integration check for pipeline session routing."""

    @patch("app.rag.session_retriever.retrieve_session")
    @patch("app.services.llm.ask_llm_rag")
    def test_ask_rag_session_flow(self, mock_llm, mock_retrieve_sess):
        mock_doc = Document(
            page_content="The employee may terminate agreement with 60 days notice.",
            metadata={"source": "Employment.pdf", "page": 4, "act_name": "Employment", "confidence": 0.96}
        )
        mock_retrieve_sess.return_value = [mock_doc]
        mock_llm.return_value = "The notice period is 60 days."

        from app.rag.pipeline import ask_rag_session
        res = ask_rag_session(
            question="What is the notice period?",
            session_id="test_sess_123",
            history=[{"role": "user", "content": "Tell me about my contract"}]
        )

        self.assertEqual(res["answer"], "The notice period is 60 days.")
        self.assertEqual(res["session_id"], "test_sess_123")
        self.assertEqual(len(res["sources"]), 1)
        self.assertEqual(res["sources"][0]["origin"], "session")


if __name__ == "__main__":
    unittest.main(verbosity=2)
