"""
test_legal_rag_engine.py — Unit tests for Step 6 Legal RAG Engine.

Verifies:
1. Knowledge Base Retrieval (ChromaDB + BM25 hybrid search)
2. No-Result Situation Handling (Low confidence / unindexed law returns verified info disclaimer)
3. Source Metadata Attribution (act_name, section, article, confidence)
4. Context Injection Formatting (Structured document headers)
5. Hallucination Prevention Directive & 3-Part Structure
"""
import pytest
from app.rag.retriever import retrieve
from app.rag.pipeline import ask_rag
from app.services.llm import generate_rag_system_prompt
from langchain_core.documents import Document


def test_1_retrieval_statutes_and_provisions():
    """Test 1: Retrieves relevant statutory documents from ChromaDB."""
    query = "What are the fundamental rights under Article 21 of Constitution of India?"
    results = retrieve(query, k=5)

    assert isinstance(results, list)
    assert len(results) > 0
    top_doc = results[0]
    assert hasattr(top_doc, "page_content")
    assert hasattr(top_doc, "metadata")
    assert "confidence" in top_doc.metadata or "fusion_score" in top_doc.metadata or "vector_score" in top_doc.metadata


def test_2_no_result_low_confidence_fallback():
    """Test 2: Querying unknown/unindexed laws returns low confidence fallback disclaimer."""
    query = "What is Section 9999 of the Intergalactic Space Exploration Act 2099?"
    results = retrieve(query, k=3)

    assert isinstance(results, list)
    assert len(results) > 0
    # Top document should be low confidence fallback or have low confidence score
    top_doc = results[0]
    conf = top_doc.metadata.get("confidence", 0.0)
    assert conf < 0.30 or top_doc.metadata.get("low_confidence_fallback") is True
    assert "couldn't find sufficient evidence" in top_doc.page_content.lower() or conf < 0.30


def test_3_source_attribution_metadata():
    """Test 3: Retrieved documents contain rich source metadata."""
    query = "Section 138 Negotiable Instruments Act dishonour of cheque"
    rag_response = ask_rag(query)

    assert "sources" in rag_response
    assert "citations" in rag_response
    assert len(rag_response["sources"]) > 0

    src = rag_response["sources"][0]
    assert "source" in src
    assert "relevance_score" in src
    assert "content_preview" in src
    assert src["relevance_score"] >= 0.0


def test_4_context_injection():
    """Test 4: RAG pipeline injects context into formatted structured blocks."""
    from app.rag.citations import build_citations, build_readable_citation_block
    doc1 = Document(page_content="Article 21 guarantees right to life.", metadata={"act_name": "Constitution of India", "primary_article": "21", "page": 1})
    doc2 = Document(page_content="Section 138 deals with cheque bounce.", metadata={"act_name": "NI Act", "section": "138", "page": 4})

    citations = build_citations([doc1, doc2])
    formatted_block = build_readable_citation_block(citations)
    assert "Constitution of India" in formatted_block
    assert "NI Act" in formatted_block or "Retrieved Sources" in formatted_block


def test_5_hallucination_prevention_prompt():
    """Test 5: RAG System Prompt enforces 3-part structure and strict non-hallucination rules."""
    prompt = generate_rag_system_prompt("en")

    # 3-part structure checks
    assert "WHAT THE SOURCE SAYS" in prompt
    assert "WHAT IT MAY MEAN FOR THE USER" in prompt
    assert "PRACTICAL NEXT STEP" in prompt

    # Non-hallucination rule checks
    assert "Answer ONLY using facts from the provided context" in prompt
    assert "NEVER invent section numbers" in prompt
