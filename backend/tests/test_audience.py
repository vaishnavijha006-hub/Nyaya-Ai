"""
tests/test_audience.py - Phase 12 Audience-Aware Legal Explanations.

The audience setting must affect only the LLM explanation style.
Retrieval, citations, sources, memory, and streaming response shape remain unchanged.
"""

import os
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import HTTPException
from langchain_core.documents import Document

from app.api.chat import ChatRequest, _validate_audience
from app.rag.pipeline import ask_rag
from app.services.llm import ask_llm_rag, ask_llm_rag_stream, generate_audience_prompt


AUDIENCES = ["default", "student", "lawyer", "upsc", "child"]


def _doc() -> Document:
    return Document(
        page_content="Article 21 protects life and personal liberty according to procedure established by law.",
        metadata={
            "act_name": "Constitution of India",
            "document_type": "Constitution",
            "source": "constitution_of_india.pdf",
            "primary_article": "21",
            "article": "21",
            "page": 10,
            "confidence": 0.97,
            "chunk_id": "article_21_chunk",
        },
    )


def _fake_response(text: str):
    return SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(content=text),
            )
        ]
    )


class TestAudiencePrompts(unittest.TestCase):
    def test_all_supported_audiences_work(self):
        for audience in AUDIENCES:
            with self.subTest(audience=audience):
                prompt = generate_audience_prompt(audience)
                self.assertTrue(prompt)
                self.assertIn("Do not alter legal facts, citations, or source references", prompt)

    @patch("app.services.llm.get_groq_client")
    def test_audience_prompt_is_injected_before_context(self, mock_client_factory):
        client = MagicMock()
        client.chat.completions.create.return_value = _fake_response("student-style answer")
        mock_client_factory.return_value = client

        answer = ask_llm_rag(
            question="Explain Article 21",
            context="Retrieved context",
            language="en",
            history="User: What is Article 21?",
            audience="student",
        )

        self.assertEqual(answer, "student-style answer")
        messages = client.chat.completions.create.call_args.kwargs["messages"]
        user_prompt = messages[1]["content"]
        self.assertLess(user_prompt.index("Audience Prompt:"), user_prompt.index("Context from Legal Documents"))
        self.assertLess(user_prompt.index("Context from Legal Documents"), user_prompt.index("Previous Conversation History"))
        self.assertLess(user_prompt.index("Previous Conversation History"), user_prompt.index("Question: Explain Article 21"))
        self.assertIn("educational clarity", user_prompt)


class TestAudiencePipelineInvariants(unittest.TestCase):
    @patch("app.services.llm.ask_llm_rag")
    @patch("app.rag.pipeline.retrieve")
    def test_retrieval_citations_sources_and_memory_unchanged(self, mock_retrieve, mock_llm):
        mock_retrieve.return_value = [_doc()]
        mock_llm.side_effect = lambda **kwargs: f"{kwargs['audience']} wording"
        history = [{"role": "user", "content": "Tell me about Article 21"}]

        baseline = ask_rag("Explain this", history=history, audience="default")
        student = ask_rag("Explain this", history=history, audience="student")

        self.assertEqual(mock_retrieve.call_args_list[0].args, mock_retrieve.call_args_list[1].args)
        self.assertEqual(mock_retrieve.call_args_list[0].kwargs, mock_retrieve.call_args_list[1].kwargs)
        self.assertEqual(len(baseline["citations"]), len(student["citations"]))
        self.assertEqual([c.model_dump() for c in baseline["citations"]], [c.model_dump() for c in student["citations"]])
        self.assertEqual(len(baseline["sources"]), len(student["sources"]))
        self.assertEqual(baseline["sources"], student["sources"])
        self.assertNotEqual(baseline["answer"], student["answer"])

    @patch("app.services.llm.ask_llm_rag")
    @patch("app.rag.pipeline.retrieve")
    def test_each_audience_reaches_llm_without_changing_retrieval(self, mock_retrieve, mock_llm):
        mock_retrieve.return_value = [_doc()]
        mock_llm.side_effect = lambda **kwargs: f"answer for {kwargs['audience']}"

        retrieval_calls = []
        for audience in AUDIENCES:
            with self.subTest(audience=audience):
                result = ask_rag("Explain Article 21", audience=audience)
                self.assertEqual(result["answer"], f"answer for {audience}")
                retrieval_calls.append((mock_retrieve.call_args.args, mock_retrieve.call_args.kwargs))

        self.assertTrue(all(call == retrieval_calls[0] for call in retrieval_calls))


class TestAudienceValidationAndStreaming(unittest.TestCase):
    def test_invalid_audience_returns_http_400(self):
        body = ChatRequest(question="Explain Article 21", audience="expert")
        with self.assertRaises(HTTPException) as ctx:
            _validate_audience(body.audience)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Invalid audience", ctx.exception.detail)

    @patch("app.services.llm.get_groq_client")
    def test_streaming_unchanged_with_audience(self, mock_client_factory):
        client = MagicMock()
        client.chat.completions.create.return_value = [
            SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content="Token "))]),
            SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content="stream"))]),
        ]
        mock_client_factory.return_value = client

        tokens = list(ask_llm_rag_stream(
            question="Explain Article 21",
            context="Retrieved context",
            language="en",
            audience="child",
        ))

        self.assertEqual(tokens, ["Token ", "stream"])
        kwargs = client.chat.completions.create.call_args.kwargs
        self.assertTrue(kwargs["stream"])
        self.assertIn("very simple English", kwargs["messages"][1]["content"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
