import json
from typing import AsyncGenerator
from app.services.legal_query_builder import build_legal_query
from app.services.legal_retrieval import retrieve_legal_documents
from app.services.legal_reranker import rerank_documents
from app.services.legal_verification import verify_legal_claims
from app.services.llm import ask_llm_rag_stream, ask_llm_rag
from app.rag.citations import CitationItem, build_citations

def query_temporal_rag(query: str, start_year: int, end_year: int) -> str:
    """
    Simulates checking a multi-year query against temporal logic.
    If the time range is wide (>= 2 years) across potential legislative updates,
    we enforce human review instead of synthesizing a possibly invalid legal interpolation.
    """
    if abs(end_year - start_year) >= 2:
        return "HUMAN_REVIEW_REQUIRED"
    return "Interpolated answer"

async def run_legal_rag(case_info: dict, question: str, language: str, history_str: str, audience: str) -> dict:
    query_info = build_legal_query(case_info, question)
    docs = await retrieve_legal_documents(query_info)
    ranked_docs = rerank_documents(question, docs)
    
    context_parts = [doc.get('content_preview', '') for doc in ranked_docs] if ranked_docs else []
    context = "\n\n---\n\n".join(context_parts)
    
    answer = ""
    # Assuming ask_llm_rag exists or we can just join the stream
    for token in ask_llm_rag_stream(question, context=context, language=language, history=history_str, audience=audience):
        answer += token
        
    verification = verify_legal_claims(answer, ranked_docs)
    
    return {
        "answer": answer,
        "documents": ranked_docs,
        "verification": verification
    }

async def run_legal_rag_stream(
    case_info: dict,
    question: str,
    language: str,
    history_str: str,
    audience: str
) -> AsyncGenerator[str, None]:
    """
    Run the verified legal RAG pipeline, yielding SSE events.
    """
    yield json.dumps({"type": "legal_retrieval_started", "message": "Initiating verified legal retrieval..."})
    
    query_info = build_legal_query(case_info, question)
    docs = await retrieve_legal_documents(query_info)
    
    yield json.dumps({"type": "legal_sources_found", "count": len(docs), "message": f"Found {len(docs)} legal sources."})
    
    ranked_docs = rerank_documents(question, docs)
    
    yield json.dumps({"type": "legal_analysis", "message": "Analyzing cross-references and legal principles..."})
    
    # Format context
    context_parts = [doc.get('content_preview', '') for doc in ranked_docs] if ranked_docs else []
    context = "\n\n---\n\n".join(context_parts)
    
    yield json.dumps({"type": "status", "message": "Drafting verified legal response..."})
    
    # Generate answer
    full_answer = ""
    for token in ask_llm_rag_stream(question, context=context, language=language, history=history_str, audience=audience):
        full_answer += token
        yield json.dumps({"type": "token", "content": token})
    
    # Verification
    verification = verify_legal_claims(full_answer, ranked_docs)
    
    yield json.dumps({
        "type": "legal_confidence",
        "confidence": verification["confidence"],
        "analysis": verification["analysis"]
    })
    
    yield json.dumps({"type": "legal_retrieval_complete", "message": "Verified legal response complete."})
    yield json.dumps({"type": "done"})
