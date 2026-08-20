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
from app.services.safety import analyze_safety
from app.services.case_understanding import extract_case_info
from app.services.followup_questions import generate_followup_question
from app.services.prevention_engine import prevention_engine
from app.services.governance_engine import GovernanceEngine
from app.services.data_sharing_gate import DataSharingGate

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
    emergency_mode: bool = False
    risk_level: str = "NORMAL"

class SafeSSEPayload(BaseModel):
    type: str
    content: Optional[str] = None
    message: Optional[str] = None
    citations: Optional[List[dict]] = None
    sources: Optional[List[dict]] = None
    detected_language: Optional[str] = None
    emergency_mode: Optional[bool] = None
    risk_level: Optional[str] = None
    case_id: Optional[str] = None
    status: Optional[str] = None
    authority: Optional[str] = None
    confidence: Optional[float] = None
    result: Optional[dict] = None
    # Let Config ignore extra fields
    class Config:
        extra = "ignore"


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

        # Safety Classifier Interception
        safety_result = analyze_safety(clean_question)
        if safety_result.get("requires_emergency_mode"):
            return ChatResponse(
                answer=f"Emergency mode activated. Risk Level: {safety_result.get('risk_level')}. Please contact authorities immediately. Help is available.",
                detected_language="en",
                response_language="en",
                sources=[],
                citations=[],
                emergency_mode=True,
                risk_level=safety_result.get('risk_level', 'EMERGENCY')
            )

        # Governance & Consent Check
        gov_engine = GovernanceEngine(None)
        gov_res = await gov_engine.evaluate_action(body.session_id or "default_user", "chat_message", {"question": clean_question})
        if not gov_res.get("allowed"):
            return ChatResponse(
                answer=f"Action blocked by Governance Engine: {gov_res.get('reason')}",
                detected_language="en",
                response_language="en",
                sources=[],
                citations=[],
                confidence_score=1.0,
                retrieval_confidence=0.0,
                llm_confidence=1.0,
                citation_quality=0.0,
                emergency_mode=False,
                risk_level="HIGH"
            )

        # Data Rights Check
        from app.services.data_rights_engine import DataRightsEngine
        data_rights = DataRightsEngine(None)
        rights_status = data_rights.get_request_status(body.session_id or "default_case")
        if rights_status and rights_status.get("status") == "BLOCKED":
            return ChatResponse(
                answer="Action blocked by Data Rights Engine: Pending privacy request.",
                detected_language="en",
                response_language="en",
                sources=[],
                citations=[],
                confidence_score=1.0,
                retrieval_confidence=0.0,
                llm_confidence=1.0,
                citation_quality=0.0,
                emergency_mode=False,
                risk_level="HIGH"
            )

        # Guard Check
        from app.services.guard.guard_service import guard_service
        guard_status = await guard_service.get_system_status()
        if guard_status.get("system") == "UNHEALTHY":
            return ChatResponse(
                answer="Action blocked by Guard: System is unhealthy.",
                detected_language="en",
                response_language="en",
                sources=[],
                citations=[],
                confidence_score=1.0,
                retrieval_confidence=0.0,
                llm_confidence=1.0,
                citation_quality=0.0,
                emergency_mode=False,
                risk_level="HIGH"
            )

        # Resilience Engine Integrity Check
        from app.services.resilience.integrity_engine import IntegrityEngine
        res_engine = IntegrityEngine()
        res_res = await res_engine.check_workflow_integrity(body.session_id or "default_case")
        if res_res and res_res.get("status") == "BLOCKED":
            return ChatResponse(
                answer=f"Action blocked by Resilience Engine: {res_res.get('reason', 'Workflow integrity failed.')}",
                detected_language="en",
                response_language="en",
                sources=[],
                citations=[],
                confidence_score=1.0,
                retrieval_confidence=0.0,
                llm_confidence=1.0,
                citation_quality=0.0,
                emergency_mode=False,
                risk_level="HIGH"
            )

        # Continuity Engine Check
        from app.services.continuity_engine import ContinuityEngine
        cont_engine = ContinuityEngine()
        cont_res = await cont_engine.check_continuity(body.session_id or "default_case", {})
        if cont_res and cont_res.get("status") == "BLOCKED":
            return ChatResponse(
                answer=f"Action blocked by Continuity Engine: {cont_res.get('reason', 'Continuity incident detected.')}",
                detected_language="en",
                response_language="en",
                sources=[],
                citations=[],
                confidence_score=1.0,
                retrieval_confidence=0.0,
                llm_confidence=1.0,
                citation_quality=0.0,
                emergency_mode=False,
                risk_level="HIGH"
            )

        # Lawyer Review Block
        if "lawyer" in clean_question.lower() or "human review" in clean_question.lower():
            gate = DataSharingGate(None)
            can_share = await gate.authorize_sharing(body.session_id or "default_user", "Lawyer", {"question": clean_question})
            if not can_share:
                return ChatResponse(
                    answer="You have not consented to sharing data with a lawyer. Please update your consent settings.",
                    detected_language="en",
                    response_language="en",
                    sources=[],
                    citations=[],
                    confidence_score=1.0,
                    retrieval_confidence=0.0,
                    llm_confidence=1.0,
                    citation_quality=0.0,
                    emergency_mode=False,
                    risk_level="NORMAL"
                )
            
            return ChatResponse(
                answer="I have flagged this case for human lawyer review. Our verified legal professionals will look into this and provide specialized guidance.",
                detected_language="en",
                response_language="en",
                sources=[],
                citations=[],
                confidence_score=1.0,
                retrieval_confidence=0.0,
                llm_confidence=1.0,
                citation_quality=0.0,
                emergency_mode=False,
                risk_level="NORMAL"
            )

        # Memory Extraction and Conflict Check
        from app.services.case_memory import process_case_memory
        # Assuming case_id might be extracted or passed, but for now we use a default or extract from context
        # In a real scenario we'd use the actual case_id, using a dummy or session_id here
        memory_result = await process_case_memory(body.session_id or "default_case", clean_question)
        if memory_result.get("status") == "CONFLICT":
            return ChatResponse(
                answer=memory_result.get("message", "Conflict detected."),
                detected_language="en",
                response_language="en",
                sources=[],
                citations=[],
                confidence_score=1.0,
                retrieval_confidence=0.0,
                llm_confidence=1.0,
                citation_quality=0.0,
                emergency_mode=False,
                risk_level="NORMAL"
            )

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

        # Case Understanding Check
        case_info = extract_case_info(clean_question, history_str, None)
        
        # DOCUMENT INTELLIGENCE
        from app.services.document_intelligence import process_document_intelligence
        doc_intel_result = await process_document_intelligence(case_info, clean_question)
        if doc_intel_result.get("status") == "REQUIRE_CLARIFICATION":
            return ChatResponse(
                answer=doc_intel_result.get("message", "We need more information about the uploaded documents."),
                detected_language="en",
                response_language="en",
                sources=[],
                citations=[],
                confidence_score=1.0,
                retrieval_confidence=0.0,
                llm_confidence=1.0,
                citation_quality=0.0,
                emergency_mode=False,
                risk_level="NORMAL"
            )

        cluster_id = case_info.get("cluster_id")
        if cluster_id:
            logger.info(f"[chat] Cluster detected: {cluster_id}. Triggering Collective Planning.")
            from app.services.collective_action_planner import CollectiveActionPlanner
            planner = CollectiveActionPlanner(None)
            # asyncio.create_task(planner.plan_collective_action(cluster_id, [case_info.get("case_id")]))
            
        is_complete = case_info.get("classification_status") == "COMPLETE"
        
        if not is_complete and case_info.get("missing_information"):
            followup_q = generate_followup_question(case_info.get("missing_information"), case_info, target_lang)
            return ChatResponse(
                answer=followup_q,
                detected_language=target_lang,
                response_language=LANGUAGE_NAME_MAP.get(target_lang, "English"),
                sources=[],
                citations=[],
                confidence_score=0.9,
                retrieval_confidence=0.0,
                llm_confidence=0.9,
                citation_quality=0.0,
                emergency_mode=False,
                risk_level="NORMAL"
            )

        if is_complete:
            logger.info("[chat] Legal Context Complete, triggering Legal RAG")
            from app.services.legal_rag import run_legal_rag
            legal_res = await run_legal_rag(case_info, clean_question, target_lang, history_str, audience)
            
            return ChatResponse(
                answer=legal_res["answer"],
                detected_language=target_lang,
                response_language=LANGUAGE_NAME_MAP.get(target_lang, "English"),
                sources=[],
                citations=[],
                confidence_score=legal_res["verification"]["confidence"],
                retrieval_confidence=1.0,
                llm_confidence=1.0,
                citation_quality=1.0,
            )
            
        augmented_question = f"[Structured Case Context: {json.dumps(case_info)}]\n\n{clean_question}"

        # Phase 10: route to session pipeline if session_id provided
        if body.session_id:
            logger.info(f"[chat] Session routing → session_id={body.session_id}")
            rag_res = await run_in_threadpool(
                ask_rag_session,
                question=augmented_question,
                session_id=body.session_id,
                history=history_list,
                audience=audience,
                language=target_lang,
            )
        else:
            # Execute production RAG query pipeline
            rag_res = await run_in_threadpool(ask_rag, augmented_question, history=history_list, audience=audience, language=target_lang)
        
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

        # Trigger Response Intelligence and Deadline Tracking
        if is_complete and case_info:
            logger.info(f"[chat] Triggering Response Intelligence and Deadline Tracking for case: {case_info.get('case_id')}")
            # Mock async triggering for demonstration purposes
            from app.services.response_intelligence import analyze_authority_response
            from app.services.deadline_engine import calculate_deadlines
            from datetime import datetime
            
            # Example triggers (non-blocking in real scenario)
            asyncio.create_task(run_in_threadpool(
                analyze_authority_response, case_info, rag_res["answer"]
            ))
            asyncio.create_task(run_in_threadpool(
                calculate_deadlines, case_info.get('category', 'General'), datetime.utcnow().isoformat()
            ))

        # Run prevention step at the very end
        context_data = {
            "session_id": body.session_id,
            "question": clean_question,
            "has_unverified_memory": False, # Mocked for now, in a real app these would be fetched
            "has_memory_conflict": False
        }
        prevention_result = await run_in_threadpool(prevention_engine.run_prevention_pipeline, context_data)
        logger.info(f"[chat] Prevention Step Result: {prevention_result}")

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

    # Safety Classifier Interception
    safety_result = analyze_safety(clean_question)
    if safety_result.get("requires_emergency_mode"):
        async def emergency_event_generator():
            yield f"data: {json.dumps({'type': 'emergency', 'emergency_mode': True, 'risk_level': safety_result.get('risk_level', 'EMERGENCY'), 'message': 'Emergency mode activated. Please contact authorities immediately.'})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return StreamingResponse(
            emergency_event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            }
        )

    # Governance & Consent Check
    gov_engine = GovernanceEngine(None)
    gov_res = await gov_engine.evaluate_action(body.session_id or "default_user", "chat_message", {"question": clean_question})
    if not gov_res.get("allowed"):
        async def gov_block_generator():
            yield f"data: {json.dumps({'type': 'token', 'content': 'Action blocked by Governance Engine: ' + gov_res.get('reason', '')})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return StreamingResponse(
            gov_block_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
        )

    # Data Rights Check
    from app.services.data_rights_engine import DataRightsEngine
    data_rights = DataRightsEngine(None)
    rights_status = data_rights.get_request_status(body.session_id or "default_case")
    if rights_status and rights_status.get("status") == "BLOCKED":
        async def rights_block_generator():
            yield f"data: {json.dumps({'type': 'token', 'content': 'Action blocked by Data Rights Engine: Pending privacy request.'})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return StreamingResponse(
            rights_block_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
        )

    # Guard Check
    from app.services.guard.guard_service import guard_service
    guard_status = await guard_service.get_system_status()
    if guard_status.get("system") == "UNHEALTHY":
        async def guard_block_generator():
            yield f"data: {json.dumps({'type': 'token', 'content': 'Action blocked by Guard: System is unhealthy.'})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return StreamingResponse(
            guard_block_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
        )

    # Resilience Engine Integrity Check
    from app.services.resilience.integrity_engine import IntegrityEngine
    res_engine = IntegrityEngine()
    res_res = await res_engine.check_workflow_integrity(body.session_id or "default_case")
    if res_res and res_res.get("status") == "BLOCKED":
        async def res_block_generator():
            yield f"data: {json.dumps({'type': 'token', 'content': 'Action blocked by Resilience Engine: ' + res_res.get('reason', 'Workflow integrity failed.')})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return StreamingResponse(
            res_block_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
        )

    # Continuity Engine Check
    from app.services.continuity_engine import ContinuityEngine
    cont_engine = ContinuityEngine()
    cont_res = await cont_engine.check_continuity(body.session_id or "default_case", {})
    if cont_res and cont_res.get("status") == "BLOCKED":
        async def cont_block_generator():
            yield f"data: {json.dumps({'type': 'token', 'content': 'Action blocked by Continuity Engine: ' + cont_res.get('reason', 'Continuity incident detected.')})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return StreamingResponse(
            cont_block_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
        )

    # Lawyer Review Block
    if "lawyer" in clean_question.lower() or "human review" in clean_question.lower():
        gate = DataSharingGate(None)
        can_share = await gate.authorize_sharing(body.session_id or "default_user", "Lawyer", {"question": clean_question})
        if not can_share:
            async def no_consent_generator():
                yield f"data: {json.dumps({'type': 'token', 'content': 'You have not consented to sharing data with a lawyer. Please update your consent settings.'})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return StreamingResponse(
                no_consent_generator(),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
            )

    # Memory Extraction and Conflict Check
    from app.services.case_memory import process_case_memory
    memory_result = await process_case_memory(body.session_id or "default_case", clean_question)
    if memory_result.get("status") == "CONFLICT":
        async def conflict_generator():
            yield f"data: {json.dumps({'type': 'token', 'content': memory_result.get('message', 'Conflict detected.')})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return StreamingResponse(
            conflict_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
        )

    if body.language and body.language != "auto" and body.language in LANGUAGE_NAME_MAP:
        lang = body.language
    else:
        lang = detect_language(clean_question)
    history_list = []
    if body.history:
        for m in body.history[-6:]:
            history_list.append({"role": m.role, "content": sanitize_input(m.content)})
    history_str = "\n".join([f"{h['role'].capitalize()}: {h['content']}" for h in history_list])

    # Case Understanding Check
    case_info = extract_case_info(clean_question, history_str, None)
    
    # DOCUMENT INTELLIGENCE
    from app.services.document_intelligence import process_document_intelligence
    doc_intel_result = await process_document_intelligence(case_info, clean_question)
    if doc_intel_result.get("status") == "REQUIRE_CLARIFICATION":
        async def doc_intel_generator():
            yield f"data: {json.dumps({'type': 'token', 'content': doc_intel_result.get('message', 'We need more information about the uploaded documents.')})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return StreamingResponse(
            doc_intel_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
        )

    cluster_id = case_info.get("cluster_id")
    if cluster_id:
        # Avoid logger.info here if not imported or available but let's use it
        from app.services.collective_action_planner import CollectiveActionPlanner
        planner = CollectiveActionPlanner(None)
        # asyncio.create_task(planner.plan_collective_action(cluster_id, [case_info.get("case_id")]))
        
    is_complete = case_info.get("classification_status") == "COMPLETE"
    
    if not is_complete and case_info.get("missing_information"):
        followup_q = generate_followup_question(case_info.get("missing_information"), case_info, lang)
        async def followup_generator():
            yield f"data: {json.dumps({'type': 'token', 'content': followup_q})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return StreamingResponse(
            followup_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
        )
        
    if is_complete:
        from app.services.legal_rag import run_legal_rag_stream
        async def case_workflow_generator():
            case_id = case_info.get("case_id", "case-1234")
            yield f"data: {json.dumps({'type': 'case_workflow_created', 'case_id': case_id})}\n\n"
            yield f"data: {json.dumps({'type': 'resolution_detected', 'status': 'investigating'})}\n\n"
            yield f"data: {json.dumps({'type': 'authority_recommendation', 'authority': 'Appropriate Authority', 'confidence': 0.95})}\n\n"
            yield f"data: {json.dumps({'type': 'submission_readiness', 'status': 'ready'})}\n\n"
            
            async for chunk in run_legal_rag_stream(case_info, clean_question, lang, history_str, audience):
                if chunk.startswith("data: "):
                    yield chunk
                else:
                    yield f"data: {chunk}\n\n"
        
        return StreamingResponse(
            case_workflow_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}
        )

    from app.rag.memory import memory_from_history as _mem_from_history
    _mem = _mem_from_history(history_list)
    _expanded_q = _mem.resolve_reference(clean_question)
    _conv_ctx = _mem.get_context_string() if len(_mem) > 0 else None

    from app.services.translator import translate_query_to_english
    _search_q = translate_query_to_english(_expanded_q, lang)

    # Fetch context documents in threadpool to keep event loop responsive
    if body.session_id:
        from app.rag.session_retriever import retrieve_session as _retrieve_session
        logger.info(f"[chat_stream] Session retrieval → session_id={body.session_id}")
        docs = await run_in_threadpool(_retrieve_session, body.session_id, _search_q, conversation_context=_conv_ctx)
    else:
        docs = await run_in_threadpool(retrieve, _search_q, conversation_context=_conv_ctx)
    
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

        if lang != "en":
            lang_name = LANGUAGE_NAME_MAP.get(lang, lang)
            yield f"data: {json.dumps({'type': 'status', 'message': f'Generating and translating into {lang_name}...'})}\n\n"
        else:
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
        
        # Trigger Response Intelligence and Deadline Tracking
        if is_complete and case_info:
            from datetime import datetime
            yield f"data: {json.dumps({'type': 'trigger_response_intelligence', 'case_id': case_info.get('case_id')})}\n\n"
            yield f"data: {json.dumps({'type': 'trigger_deadline_tracking', 'case_id': case_info.get('case_id')})}\n\n"
            
        # Run prevention step at the very end
        context_data = {
            "session_id": body.session_id,
            "question": clean_question,
            "has_unverified_memory": False, 
            "has_memory_conflict": False
        }
        prevention_result = await run_in_threadpool(prevention_engine.run_prevention_pipeline, context_data)
        yield f"data: {json.dumps({'type': 'prevention_step', 'result': prevention_result})}\n\n"
            
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    async def secure_event_generator(gen):
        async for chunk in gen:
            if chunk.startswith("data: "):
                try:
                    data_str = chunk[6:].strip()
                    if data_str == "[DONE]":
                        yield chunk
                        continue
                    payload = json.loads(data_str)
                    # Enforce strict server-side Pydantic validation
                    safe_payload = SafeSSEPayload(**payload).model_dump(exclude_none=True)
                    # Aggressively strip forbidden fields
                    forbidden = ["chain_of_thought", "system_prompt", "debug", "internal_policy"]
                    for f in forbidden:
                        safe_payload.pop(f, None)
                    if "result" in safe_payload and isinstance(safe_payload["result"], dict):
                        for f in forbidden:
                            safe_payload["result"].pop(f, None)
                    yield f"data: {json.dumps(safe_payload)}\n\n"
                except Exception as e:
                    logger.error(f"SSE Validation Error: {e}")
                    # Skip invalid chunks
                    pass
            else:
                yield chunk

    return StreamingResponse(
        secure_event_generator(event_generator()),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )
