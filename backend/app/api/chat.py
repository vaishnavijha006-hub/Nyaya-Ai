import logging
import json
import asyncio
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services.llm import ask_llm, ask_llm_rag_stream, ALLOWED_AUDIENCES, normalize_audience
from app.rag.pipeline import ask_rag, ask_rag_session, detect_language, LANGUAGE_NAME_MAP
from app.rag.retriever import retrieve
from app.rag.citations import CitationItem, build_citations, build_readable_citation_block
from app.utils.security import sanitize_input, check_prompt_injection

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    history: Optional[List[ChatMessage]] = Field(default=[])
    stream: Optional[bool] = Field(default=False)
    audience: Optional[str] = Field(default="default")
    language: Optional[str] = Field(default="auto")
    session_id: Optional[str] = Field(default=None)


class SourceItem(BaseModel):
    page: Optional[int] = None
    source: str
    primary_article: Optional[str] = ""
    article_refs: Optional[str] = ""
    content_preview: str
    relevance_score: float
    origin: str


class ChatResponse(BaseModel):
    answer: str
    detected_language: str
    response_language: str
    sources: List[SourceItem] = []
    citations: List[CitationItem] = []
    confidence_score: float = 0.92
    retrieval_confidence: float = 0.88
    llm_confidence: float = 0.95
    citation_quality: float = 0.90


def _validate_audience(audience: Optional[str]) -> str:
    try:
        return normalize_audience(audience or "default")
    except ValueError:
        allowed = ", ".join(sorted(ALLOWED_AUDIENCES))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid audience. Allowed values: {allowed}",
        )


@router.post("/", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat(request: Request, body: ChatRequest):
    """
    RAG-grounded Chat Endpoint with 30 req/min rate limiting,
    prompt injection protection, and input sanitization.
    """
    try:
        audience = _validate_audience(body.audience)
        clean_question = sanitize_input(body.question)
        check_prompt_injection(clean_question)

        # Format conversation history
        history_list = []
        if body.history:
            for m in body.history[-6:]:
                history_list.append({"role": m.role, "content": sanitize_input(m.content)})
        history_str = "\n".join([f"{h['role'].capitalize()}: {h['content']}" for h in history_list])

        if body.language and body.language != "auto" and body.language in LANGUAGE_NAME_MAP:
            target_lang = body.language
        else:
            target_lang = detect_language(clean_question)

        # Phase 10: route to session pipeline if session_id provided
        if body.session_id:
            logger.info(f"[chat] Session routing → session_id={body.session_id}")
            rag_res = await run_in_threadpool(
                ask_rag_session,
                question=clean_question,
                session_id=body.session_id,
                history=history_list,
                audience=audience,
                language=target_lang,
            )
        else:
            # Execute production RAG query pipeline
            rag_res = await run_in_threadpool(ask_rag, clean_question, history=history_list, audience=audience, language=target_lang)
        
        # Calculate composite confidence scores
        sources = rag_res.get("sources", [])
        if sources:
            top_score = max([s.get("relevance_score", 0.5) for s in sources])
            retrieval_conf = round(float(top_score), 2)
        else:
            retrieval_conf = 0.40

        llm_conf = 0.94 if len(rag_res["answer"]) > 100 else 0.75
        citation_qual = 0.95 if sources else 0.50
        composite_conf = round((retrieval_conf * 0.4) + (llm_conf * 0.3) + (citation_qual * 0.3), 2)

        return ChatResponse(
            answer=rag_res["answer"],
            detected_language=rag_res["detected_language"],
            response_language=rag_res["response_language"],
            sources=[SourceItem(**s) for s in sources],
            citations=rag_res.get("citations", []),
            confidence_score=composite_conf,
            retrieval_confidence=retrieval_conf,
            llm_confidence=llm_conf,
            citation_quality=citation_qual,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error in chat endpoint: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing failed: {str(exc)}"
        )


@router.post("/stream")
@limiter.limit("30/minute")
async def chat_stream(request: Request, body: ChatRequest):
    """
    Server-Sent Events (SSE) Streaming Chat Endpoint with rate limiting
    and prompt injection protection.
    """
    audience = _validate_audience(body.audience)
    clean_question = sanitize_input(body.question)
    check_prompt_injection(clean_question)

    if body.language and body.language != "auto" and body.language in LANGUAGE_NAME_MAP:
        lang = body.language
    else:
        lang = detect_language(clean_question)
    history_list = []
    if body.history:
        for m in body.history[-6:]:
            history_list.append({"role": m.role, "content": sanitize_input(m.content)})
    history_str = "\n".join([f"{h['role'].capitalize()}: {h['content']}" for h in history_list])

    from app.rag.memory import memory_from_history as _mem_from_history
    _mem = _mem_from_history(history_list)
    _expanded_q = _mem.resolve_reference(clean_question)
    _conv_ctx = _mem.get_context_string() if len(_mem) > 0 else None

    # Fetch context documents in threadpool to keep event loop responsive
    if body.session_id:
        from app.rag.session_retriever import retrieve_session as _retrieve_session
        logger.info(f"[chat_stream] Session retrieval → session_id={body.session_id}")
        docs = await run_in_threadpool(_retrieve_session, body.session_id, _expanded_q, conversation_context=_conv_ctx)
    else:
        docs = await run_in_threadpool(retrieve, _expanded_q, conversation_context=_conv_ctx)
    
    context_parts = []
    sources = []

    stream_citations = build_citations(docs)
    readable_block = build_readable_citation_block(stream_citations)

    if readable_block:
        context_parts.append(readable_block)

    for doc in docs:
        page = doc.metadata.get("page", "?")
        source_name = doc.metadata.get("act_name") or doc.metadata.get("source") or "Legal Document"
        art = doc.metadata.get("primary_article") or doc.metadata.get("article") or ""
        sec = doc.metadata.get("section") or ""
        if art:
            ref_label = f"Article {art}"
        elif sec:
            ref_label = f"Section {sec}"
        else:
            ref_label = f"Page {page}"
        context_parts.append(f"=== {source_name} | {ref_label} | Page {page} ===\n\n{doc.page_content}")

        score = doc.metadata.get("confidence") or doc.metadata.get("fusion_score") or doc.metadata.get("score") or 0.85
        sources.append({
            "page": page,
            "source": doc.metadata.get("source", "Legal Document"),
            "primary_article": art,
            "content_preview": doc.page_content[:250],
            "relevance_score": round(float(score), 2),
            "origin": "vector"
        })

    context = "\n\n---\n\n".join(context_parts)

    async def event_generator():
        yield f"data: {json.dumps({'type': 'status', 'message': 'Searching knowledge base...'})}\n\n"
        await asyncio.sleep(0)

        seen_acts: list[str] = []
        for doc in docs:
            act = doc.metadata.get("act_name") or doc.metadata.get("source") or "Legal Document"
            if act not in seen_acts:
                seen_acts.append(act)

        reading_label = ", ".join(seen_acts) if seen_acts else "knowledge base"
        yield f"data: {json.dumps({'type': 'status', 'message': f'Reading {reading_label}...'})}\n\n"
        await asyncio.sleep(0)

        yield f"data: {json.dumps({'type': 'status', 'message': 'Generating legal answer...'})}\n\n"
        await asyncio.sleep(0)

        token_count = 0
        for token in ask_llm_rag_stream(clean_question, context=context, language=lang, history=history_str, audience=audience):
            token_event = {"type": "token", "content": token}
            yield f"data: {json.dumps(token_event)}\n\n"
            token_count += 1
            if token_count % 10 == 0:
                await asyncio.sleep(0)

        yield f"data: {json.dumps({'type': 'sources', 'citations': [c.model_dump() for c in stream_citations], 'sources': sources, 'detected_language': lang})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )
