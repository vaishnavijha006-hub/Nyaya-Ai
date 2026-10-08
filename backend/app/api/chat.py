"""
chat.py — Nyaya AI Chat API with Full Legal Journey State Machine.

Implements the complete intelligent legal assistance workflow:
  GATHER_DETAILS → REQUEST_DOCUMENTS → VERIFY_DOCUMENTS →
  LEGAL_ANALYSIS → CHECK_AID_ELIGIBILITY → ROUTE_AID →
  CASE_TYPE_ANALYSIS → ACTION_PLAN → COMPLETE

Reuses all existing services: RAG, LLM, safety, governance, resilience, continuity.
"""
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

from app.services.llm import ask_llm_rag_stream, ALLOWED_AUDIENCES, normalize_audience
from app.rag.pipeline import detect_language, LANGUAGE_NAME_MAP
from app.rag.citations import CitationItem, build_citations, build_readable_citation_block
from app.utils.security import sanitize_input, check_prompt_injection
from app.services.safety import analyze_safety
from app.services.governance_engine import GovernanceEngine
from app.services.data_sharing_gate import DataSharingGate

# Journey services
from app.services.journey_state import (
    get_state, update_state, advance_stage, set_stage,
    STAGE_GATHER_DETAILS, STAGE_REQUEST_DOCUMENTS, STAGE_VERIFY_DOCUMENTS,
    STAGE_LEGAL_ANALYSIS, STAGE_CHECK_ELIGIBILITY, STAGE_ROUTE_AID,
    STAGE_CASE_TYPE_ANALYSIS, STAGE_ACTION_PLAN, STAGE_COMPLETE,
)
from app.services.case_intake import extract_case_info_real, generate_smart_followup
from app.services.document_request_engine import (
    get_required_documents, format_document_request_message,
    verify_document_against_statements,
)
from app.services.legal_analysis_engine import run_legal_analysis, format_legal_analysis_message
from app.services.legal_aid_eligibility import (
    get_next_eligibility_question, parse_eligibility_answer, evaluate_eligibility, evaluate_legal_aid_deterministic,
)
from app.services.dlsa_locator import find_dlsa, format_dlsa_message
from app.services.lawyer_matcher import match_lawyers, format_lawyer_message
from app.services.case_type_analyzer import (
    check_cluster_eligibility, check_pil_eligibility, check_lok_adalat_suitability,
    format_case_analysis_message,
)
from app.services.action_plan_generator import generate_action_plan, format_action_plan_message
from app.services.intent_classifier import (
    classify_intent, is_legal_intent, get_greeting_message, get_clarification_prompt
)
from app.services.pathway_router import route_legal_pathway
from app.services.triage_engine import evaluate_prelitigation_triage
from app.services.case_packaging import generate_structured_case_package
from app.services.cluster_engine import ClusterEngine
from app.services.systemic_action_engine import generate_pattern_report
from app.services.pil_engine import evaluate_pil_suitability
from app.services.settlement_engine import generate_pre_litigation_notice
from app.services.adr_engine import evaluate_adr_suitability
from app.services.delay_tracking_engine import evaluate_case_delay_intelligence

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/chat", tags=["chat"])

MAX_FOLLOWUP_QUESTIONS = 6


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
    verification_status: str = Field(default="GENERATED")


class SafeSSEPayload(BaseModel):
    type: str
    content: Optional[str] = None
    message: Optional[str] = None
    citations: Optional[List[dict]] = None
    sources: Optional[List[dict]] = None
    detected_language: Optional[str] = None
    verification_status: Optional[str] = None
    emergency_mode: Optional[bool] = None
    risk_level: Optional[str] = None
    case_id: Optional[str] = None
    status: Optional[str] = None
    authority: Optional[str] = None
    confidence: Optional[float] = None
    result: Optional[dict] = None
    journey_stage: Optional[str] = None
    journey_data: Optional[dict] = None
    pathway_recommendation: Optional[dict] = None
    triage_assessment: Optional[dict] = None
    case_package: Optional[dict] = None
    cluster_detection: Optional[dict] = None
    pattern_report: Optional[dict] = None
    pil_suitability: Optional[dict] = None
    pil_review_brief: Optional[dict] = None
    pre_litigation_notice: Optional[dict] = None
    settlement_session: Optional[dict] = None
    legal_aid_assessment: Optional[dict] = None
    adr_analysis: Optional[dict] = None
    delay_tracking: Optional[dict] = None
    data: Optional[dict] = None
    analysis: Optional[dict] = None
    classification: Optional[dict] = None
    count: Optional[int] = None
    matches: Optional[list] = None
    question: Optional[dict] = None
    draft: Optional[dict] = None
    review: Optional[dict] = None
    conflict: Optional[dict] = None
    update: Optional[dict] = None
    documents: Optional[list] = None

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


async def _run_safety_checks(request: Request, body: ChatRequest, clean_question: str):
    """Run all safety/governance checks. Returns (blocked: bool, response_data: dict)."""
    safety_result = analyze_safety(clean_question)
    if safety_result.get("requires_emergency_mode"):
        return True, {
            "type": "emergency",
            "emergency_mode": True,
            "risk_level": safety_result.get("risk_level", "EMERGENCY"),
            "message": "Emergency mode activated. Please contact authorities immediately.",
        }

    gov_engine = GovernanceEngine(None)
    gov_res = await gov_engine.evaluate_action(
        body.session_id or "default_user", "chat_message", {"question": clean_question}
    )
    if not gov_res.get("allowed"):
        return True, {
            "type": "token",
            "content": f"Action blocked by Governance Engine: {gov_res.get('reason', '')}",
        }

    from app.services.data_rights_engine import DataRightsEngine
    data_rights = DataRightsEngine(None)
    rights_status = data_rights.get_request_status(body.session_id or "default_case")
    if rights_status and rights_status.get("status") == "BLOCKED":
        return True, {"type": "token", "content": "Action blocked by Data Rights Engine."}

    from app.services.guard.guard_service import guard_service
    guard_status = await guard_service.get_system_status()
    if guard_status.get("system") == "UNHEALTHY":
        return True, {"type": "token", "content": "Action blocked by Guard: System is unhealthy."}

    from app.services.resilience.integrity_engine import IntegrityEngine
    res_engine = IntegrityEngine()
    res_res = await res_engine.check_workflow_integrity(body.session_id or "default_case")
    if res_res and res_res.get("status") == "BLOCKED":
        return True, {"type": "token", "content": f"Action blocked by Resilience Engine: {res_res.get('reason', '')}"}

    from app.services.continuity_engine import ContinuityEngine
    cont_engine = ContinuityEngine()
    cont_res = await cont_engine.check_continuity(body.session_id or "default_case", {})
    if cont_res and cont_res.get("status") == "BLOCKED":
        return True, {"type": "token", "content": f"Action blocked by Continuity Engine: {cont_res.get('reason', '')}"}

    return False, {}


@router.post("/stream")
@limiter.limit("30/minute")
async def chat_stream(request: Request, body: ChatRequest):
    """SSE Streaming Chat with Full Legal Journey State Machine."""
    audience = _validate_audience(body.audience)
    clean_question = sanitize_input(body.question)
    check_prompt_injection(clean_question)

    blocked, block_data = await _run_safety_checks(request, body, clean_question)
    if blocked:
        async def blocked_gen():
            yield f"data: {json.dumps(block_data)}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return StreamingResponse(
            blocked_gen(), media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
        )

    if body.language and body.language != "auto" and body.language in LANGUAGE_NAME_MAP:
        lang = body.language
    else:
        lang = detect_language(clean_question)

    session_id = body.session_id or "anonymous"
    from app.services.journey_state import add_history_message, get_history_str

    history_list = []
    if body.history:
        for m in body.history[-8:]:
            history_list.append({"role": m.role, "content": sanitize_input(m.content)})
    body_history_str = "\n".join([f"{h['role'].capitalize()}: {h['content']}" for h in history_list])
    stored_history_str = get_history_str(session_id)
    history_str = body_history_str if body_history_str else stored_history_str

    async def legal_journey_generator():
        state = get_state(session_id)
        current_stage = state.get("stage", STAGE_GATHER_DETAILS)
        existing_intent = state.get("intent", "UNKNOWN")

        intent_result = await run_in_threadpool(classify_intent, clean_question, history_str)
        intent = intent_result.get("intent", "CASUAL_CHAT")

        # Map legacy aliases
        if intent in ["GREETING", "UNKNOWN"]:
            intent = "CASUAL_CHAT"
        elif intent == "GENERAL_LEGAL_QUESTION":
            intent = "GENERAL_LEGAL_QUERY"
        elif intent == "DOCUMENT_RELATED_QUERY":
            intent = "DOCUMENT_QUERY"

        is_in_personal_intake = (existing_intent == "PERSONAL_LEGAL_PROBLEM" and current_stage == STAGE_GATHER_DETAILS)
        
        if intent in ["PERSONAL_LEGAL_PROBLEM", "EMERGENCY_LEGAL_PROBLEM"]:
            update_state(session_id, {"intent": intent})
            effective_intent = intent
        elif is_in_personal_intake:
            if len(clean_question.split()) < 6 or not any(kw in clean_question.lower() for kw in ["what is", "how do i", "explain", "documents required", "procedure"]):
                effective_intent = "PERSONAL_LEGAL_PROBLEM"
            else:
                effective_intent = intent
        else:
            effective_intent = intent

        add_history_message(session_id, "user", clean_question)

        # ── HARD INTENT GATE: Non-legal inputs MUST NOT enter case/RAG modules ──
        if not is_legal_intent(effective_intent):
            if effective_intent == "INSUFFICIENT_CONTEXT":
                answer = get_clarification_prompt(clean_question, lang)
                v_status = "ADVISORY"
            else:
                answer = get_greeting_message(lang)
                v_status = "CASUAL"

            add_history_message(session_id, "assistant", answer)
            yield f"data: {json.dumps({'type': 'token', 'content': answer, 'verification_status': v_status})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        # Direct handling for non-personal legal queries
        if effective_intent in ["GENERAL_LEGAL_QUERY", "PROCEDURAL_QUERY", "DOCUMENT_QUERY"]:
            if effective_intent == "DOCUMENT_QUERY":
                from app.services.drafting_engine import run_drafting_engine
                answer = await run_drafting_engine(clean_question, lang, history_str)
                add_history_message(session_id, "assistant", answer)
                yield f"data: {json.dumps({'type': 'token', 'content': answer, 'verification_status': 'GENERATED'})}\n\n"
            else:
                legal_analysis = await run_legal_analysis(None, clean_question, lang, history_str, audience)
                answer = format_legal_analysis_message(legal_analysis)
                add_history_message(session_id, "assistant", answer)
                v_status = "GROUNDED" if legal_analysis.get("sources_count", 0) > 0 else "GENERATED"
                yield f"data: {json.dumps({'type': 'token', 'content': answer, 'verification_status': v_status})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        yield f"data: {json.dumps({'type': 'journey_stage', 'journey_stage': current_stage})}\n\n"
        await asyncio.sleep(0)

        # STAGE 1: GATHER_DETAILS
        if current_stage == STAGE_GATHER_DETAILS:
            yield f"data: {json.dumps({'type': 'status', 'message': 'Analyzing your legal situation...'})}\n\n"
            await asyncio.sleep(0)

            existing_case = state.get("case_info", {})
            case_info = await run_in_threadpool(
                extract_case_info_real, clean_question, history_str, existing_case or None
            )
            update_state(session_id, {"case_info": case_info})

            is_complete = case_info.get("classification_status") == "COMPLETE"
            missing = case_info.get("missing_information", [])
            collected_fields = case_info.get("collected_fields", {})
            uncollected_missing = [m for m in missing if not collected_fields.get(m)]
            follow_up_count = state.get("follow_up_count", 0)

            if case_info.get("category"):
                yield f"data: {json.dumps({'type': 'case_classification_update', 'data': case_info})}\n\n"
                await asyncio.sleep(0)

            if case_info.get("has_immediate_safety_concern"):
                safety_msg = "🚨 **Immediate Safety Alert**: If you are in danger, please contact Police (100) or Women Helpline (1091) immediately.\n\n"
                yield f"data: {json.dumps({'type': 'token', 'content': safety_msg})}\n\n"
                await asyncio.sleep(0)

            if not is_complete and uncollected_missing and follow_up_count < MAX_FOLLOWUP_QUESTIONS:
                asked_questions = state.get("asked_questions", [])
                target_field = uncollected_missing[0]
                
                followup_q = await run_in_threadpool(generate_smart_followup, uncollected_missing, case_info, lang, asked_questions)
                
                clean_asked_questions = [q for q in asked_questions if isinstance(q, dict)]
                clean_asked_questions.append({"question": followup_q, "field": target_field})
                
                update_state(session_id, {"follow_up_count": follow_up_count + 1, "asked_questions": clean_asked_questions})
                add_history_message(session_id, "assistant", followup_q)
                yield f"data: {json.dumps({'type': 'token', 'content': followup_q})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return

            advance_stage(session_id)
            update_state(session_id, {"case_info": case_info})
            current_stage = STAGE_REQUEST_DOCUMENTS

        # STAGE 2: REQUEST_DOCUMENTS
        if current_stage == STAGE_REQUEST_DOCUMENTS:
            state = get_state(session_id)
            case_info = state.get("case_info", {})
            docs_uploaded = state.get("documents_uploaded", [])

            if body.session_id and body.session_id != "anonymous":
                try:
                    from app.rag.session_store import get_session
                    session_meta = get_session(body.session_id)
                    if session_meta:
                        docs_uploaded = [{"filename": session_meta.filename, "pages": session_meta.pages}]
                        update_state(session_id, {"documents_uploaded": docs_uploaded})
                except Exception:
                    pass

            required_docs = get_required_documents(case_info)
            doc_message = format_document_request_message(required_docs, case_info)
            update_state(session_id, {"documents_requested": [d["id"] for d in required_docs]})

            yield f"data: {json.dumps({'type': 'document_request', 'journey_data': {'documents': required_docs, 'case_category': case_info.get('category')}})}\n\n"
            await asyncio.sleep(0)
            yield f"data: {json.dumps({'type': 'token', 'content': doc_message})}\n\n"
            await asyncio.sleep(0)

            if docs_uploaded:
                advance_stage(session_id)
                current_stage = STAGE_VERIFY_DOCUMENTS
            else:
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return

        # STAGE 3: VERIFY_DOCUMENTS
        if current_stage == STAGE_VERIFY_DOCUMENTS:
            state = get_state(session_id)
            case_info = state.get("case_info", {})
            docs_uploaded = state.get("documents_uploaded", [])

            yield f"data: {json.dumps({'type': 'status', 'message': 'Verifying uploaded documents...'})}\n\n"
            await asyncio.sleep(0)

            verification_results = []
            contradictions_found = False

            for doc in docs_uploaded[:3]:
                filename = doc.get("filename", "document")
                doc_text = ""
                if body.session_id:
                    try:
                        from app.rag.session_retriever import retrieve_session
                        chunks = await run_in_threadpool(
                            retrieve_session, body.session_id, case_info.get("issue", ""), k=3
                        )
                        doc_text = "\n\n".join([c.page_content for c in chunks])
                    except Exception as e:
                        logger.warning(f"Session chunk retrieval failed: {e}")

                user_statements = (
                    f"Case: {case_info.get('issue', '')}\n"
                    f"Facts: {', '.join(case_info.get('key_facts', []))}\n"
                    f"Evidence claimed: {', '.join(case_info.get('evidence_available', []))}"
                )

                if doc_text:
                    v = await run_in_threadpool(
                        verify_document_against_statements, user_statements, doc_text, filename
                    )
                else:
                    v = {
                        "document_type": "Uploaded document",
                        "document_status": "UNCLEAR",
                        "verification_note": f"'{filename}' received. Text extraction was limited.",
                        "contradictions": [],
                        "key_facts_extracted": [],
                        "consistent_with_user_statement": None,
                        "additional_documents_needed": [],
                    }
                v["filename"] = filename
                verification_results.append(v)
                if v.get("contradictions"):
                    contradictions_found = True

            update_state(session_id, {"documents_verified": True})
            yield f"data: {json.dumps({'type': 'document_verified', 'journey_data': {'results': verification_results, 'contradictions_found': contradictions_found}})}\n\n"
            await asyncio.sleep(0)

            if contradictions_found:
                contradictions = []
                for r in verification_results:
                    contradictions.extend(r.get("contradictions", []))
                msg = (
                    "\u26a0\ufe0f **Document Review Note:**\n\n"
                    "The document text appears inconsistent with some provided information:\n\n"
                    + "\n".join(f"\u2022 {c}" for c in contradictions[:3])
                    + "\n\n*Please clarify these points. Authenticity must be verified with the issuing authority.*\n\n"
                )
                yield f"data: {json.dumps({'type': 'token', 'content': msg})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'token', 'content': '\u2705 **Documents received.** Information appears consistent. Proceeding to legal analysis.\n\n*Note: AI review does not verify authenticity. Always verify with the issuing authority.*\n\n'})}\n\n"

            await asyncio.sleep(0)
            advance_stage(session_id)
            current_stage = STAGE_LEGAL_ANALYSIS

        # STAGE 4: LEGAL_ANALYSIS
        if current_stage == STAGE_LEGAL_ANALYSIS:
            state = get_state(session_id)
            case_info = state.get("case_info", {})

            yield f"data: {json.dumps({'type': 'legal_retrieval_started', 'message': 'Analyzing applicable laws, rights, and judgments...'})}\n\n"
            await asyncio.sleep(0)

            legal_analysis = await run_legal_analysis(case_info, clean_question, lang, history_str, audience)
            update_state(session_id, {"legal_analysis": legal_analysis})

            sources_count = legal_analysis.get('sources_count', 0)
            msg = f"Found {sources_count} legal sources."
            yield f"data: {json.dumps({'type': 'legal_sources_found', 'count': sources_count, 'message': msg})}\n\n"
            await asyncio.sleep(0)

            analysis_message = format_legal_analysis_message(legal_analysis)
            yield f"data: {json.dumps({'type': 'token', 'content': analysis_message})}\n\n"
            await asyncio.sleep(0)

            yield f"data: {json.dumps({'type': 'legal_analysis_update', 'analysis': legal_analysis})}\n\n"
            await asyncio.sleep(0)

            advance_stage(session_id)
            current_stage = STAGE_CHECK_ELIGIBILITY

        # STAGE 5: CHECK_AID_ELIGIBILITY
        if current_stage == STAGE_CHECK_ELIGIBILITY:
            state = get_state(session_id)
            profile = state.get("eligibility_profile", {})
            next_q = get_next_eligibility_question(profile)

            if next_q:
                intro = "\n\n---\n\n## Legal Aid Eligibility Check\n\nTo check if you qualify for **free government legal aid**:\n\n"
                yield f"data: {json.dumps({'type': 'eligibility_question', 'journey_data': {'question_id': next_q['id'], 'question': next_q['question'], 'type': next_q['type'], 'options': next_q.get('options', [])}})}\n\n"
                await asyncio.sleep(0)
                yield f"data: {json.dumps({'type': 'token', 'content': intro + next_q['question']})}\n\n"

                # Try to parse current message as answer
                parsed = parse_eligibility_answer(next_q["id"], clean_question)
                if parsed:
                    updated = {**profile, **parsed}
                    update_state(session_id, {"eligibility_profile": updated})
                    if not get_next_eligibility_question(updated):
                        advance_stage(session_id)
                        current_stage = STAGE_ROUTE_AID
                    else:
                        yield f"data: {json.dumps({'type': 'done'})}\n\n"
                        return
                else:
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"
                    return
            else:
                advance_stage(session_id)
                current_stage = STAGE_ROUTE_AID

        # STAGE 6: ROUTE_AID
        if current_stage == STAGE_ROUTE_AID:
            state = get_state(session_id)
            profile = state.get("eligibility_profile", {})
            case_info = state.get("case_info", {})

            yield f"data: {json.dumps({'type': 'status', 'message': 'Evaluating legal aid eligibility...'})}\n\n"
            await asyncio.sleep(0)

            eligibility_result = evaluate_eligibility(profile)
            is_eligible = eligibility_result.get("eligible", False)

            det_aid_assessment = evaluate_legal_aid_deterministic(profile, case_info)
            det_aid_dict = det_aid_assessment.model_dump()

            update_state(session_id, {
                "eligibility_result": is_eligible,
                "eligibility_reasons": eligibility_result.get("reasons", []),
                "legal_aid_assessment": det_aid_dict,
            })

            yield f"data: {json.dumps({'type': 'legal_aid_result', 'journey_data': eligibility_result})}\n\n"
            await asyncio.sleep(0)
            yield f"data: {json.dumps({'type': 'legal_aid_assessment', 'journey_data': det_aid_dict})}\n\n"
            await asyncio.sleep(0)

            if is_eligible:
                dlsa_info = find_dlsa(profile.get("state", case_info.get("location", "")), profile.get("district", ""))
                update_state(session_id, {"dlsa_info": dlsa_info})
                dlsa_message = format_dlsa_message(dlsa_info, eligibility_result)
                yield f"data: {json.dumps({'type': 'legal_aid_eligible', 'journey_data': {'dlsa': dlsa_info, 'eligibility': eligibility_result}})}\n\n"
                await asyncio.sleep(0)
                yield f"data: {json.dumps({'type': 'token', 'content': dlsa_message})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'status', 'message': 'Finding matching lawyers...'})}\n\n"
                await asyncio.sleep(0)
                lawyers = await match_lawyers(case_info)
                update_state(session_id, {"lawyer_suggestions": lawyers})
                lawyer_message = format_lawyer_message(lawyers, case_info, eligible_for_aid=False)
                yield f"data: {json.dumps({'type': 'legal_aid_ineligible', 'journey_data': {'lawyers': lawyers, 'eligibility': eligibility_result}})}\n\n"
                await asyncio.sleep(0)
                yield f"data: {json.dumps({'type': 'token', 'content': lawyer_message})}\n\n"

            await asyncio.sleep(0)
            advance_stage(session_id)
            current_stage = STAGE_CASE_TYPE_ANALYSIS

        # STAGE 7: CASE_TYPE_ANALYSIS
        if current_stage == STAGE_CASE_TYPE_ANALYSIS:
            state = get_state(session_id)
            case_info = state.get("case_info", {})

            yield f"data: {json.dumps({'type': 'status', 'message': 'Analyzing case for collective action, PIL, and Lok Adalat...'})}\n\n"
            await asyncio.sleep(0)

            cluster_result = check_cluster_eligibility(case_info, state)
            pil_result = check_pil_eligibility(case_info)
            lok_result = check_lok_adalat_suitability(case_info)
            pathway_rec = route_legal_pathway(case_info, state)
            triage_eval = evaluate_prelitigation_triage(case_info, state)
            case_pkg = generate_structured_case_package(state)

            cluster_engine_inst = ClusterEngine()
            cluster_detect = cluster_engine_inst.detect_cluster_for_case(case_info, tenant_id=session_id)

            pattern_rep = generate_pattern_report(cluster_detect, case_info)
            pattern_rep_dict = pattern_rep.model_dump() if pattern_rep else None

            pil_eval_res, pil_brief_res = evaluate_pil_suitability(case_info, state)
            pil_brief_dict = pil_brief_res.model_dump() if pil_brief_res else None

            settlement_sess = None
            settlement_notice_dict = None
            if triage_eval.settlement_potential in ["HIGH", "MEDIUM"]:
                settlement_sess = generate_pre_litigation_notice(session_id, state)
                settlement_notice_dict = settlement_sess.notice.model_dump()

            adr_eval_res = evaluate_adr_suitability(case_info, state)
            delay_report = evaluate_case_delay_intelligence(case_info, state.get("hearing_history", []))

            update_state(session_id, {
                "cluster_result": cluster_result,
                "pil_result": pil_result,
                "lok_adalat_result": lok_result,
                "pathway_recommendation": pathway_rec.model_dump(),
                "triage_assessment": triage_eval.model_dump(),
                "case_package": case_pkg.model_dump(),
                "cluster_detection": cluster_detect.model_dump(),
                "pattern_report": pattern_rep_dict,
                "pil_suitability": pil_eval_res.model_dump(),
                "pil_review_brief": pil_brief_dict,
                "settlement_session": settlement_sess.model_dump() if settlement_sess else None,
                "pre_litigation_notice": settlement_notice_dict,
                "adr_analysis": adr_eval_res.model_dump(),
                "delay_tracking": delay_report.model_dump(),
            })

            case_analysis_msg = format_case_analysis_message(cluster_result, pil_result, lok_result)
            yield f"data: {json.dumps({'type': 'case_analysis', 'journey_data': {'cluster': cluster_result, 'pil': pil_result, 'lok_adalat': lok_result}})}\n\n"
            await asyncio.sleep(0)
            yield f"data: {json.dumps({'type': 'pathway_recommendation', 'journey_data': pathway_rec.model_dump()})}\n\n"
            await asyncio.sleep(0)
            yield f"data: {json.dumps({'type': 'triage_assessment', 'journey_data': triage_eval.model_dump()})}\n\n"
            await asyncio.sleep(0)
            yield f"data: {json.dumps({'type': 'case_package', 'journey_data': case_pkg.model_dump()})}\n\n"
            await asyncio.sleep(0)
            yield f"data: {json.dumps({'type': 'cluster_detection', 'journey_data': cluster_detect.model_dump()})}\n\n"
            await asyncio.sleep(0)
            if pattern_rep_dict:
                yield f"data: {json.dumps({'type': 'pattern_report', 'journey_data': pattern_rep_dict})}\n\n"
                await asyncio.sleep(0)
            yield f"data: {json.dumps({'type': 'pil_suitability', 'journey_data': pil_eval_res.model_dump()})}\n\n"
            await asyncio.sleep(0)
            if pil_brief_dict:
                yield f"data: {json.dumps({'type': 'pil_review_brief', 'journey_data': pil_brief_dict})}\n\n"
                await asyncio.sleep(0)
            if settlement_notice_dict:
                yield f"data: {json.dumps({'type': 'pre_litigation_notice', 'journey_data': settlement_notice_dict})}\n\n"
                await asyncio.sleep(0)
            yield f"data: {json.dumps({'type': 'adr_analysis', 'journey_data': adr_eval_res.model_dump()})}\n\n"
            await asyncio.sleep(0)
            yield f"data: {json.dumps({'type': 'delay_tracking', 'journey_data': delay_report.model_dump()})}\n\n"
            await asyncio.sleep(0)
            yield f"data: {json.dumps({'type': 'token', 'content': case_analysis_msg})}\n\n"
            await asyncio.sleep(0)

            advance_stage(session_id)
            current_stage = STAGE_ACTION_PLAN

        # STAGE 8: ACTION_PLAN
        if current_stage == STAGE_ACTION_PLAN:
            state = get_state(session_id)

            yield f"data: {json.dumps({'type': 'status', 'message': 'Generating your personalized action plan...'})}\n\n"
            await asyncio.sleep(0)

            action_plan = generate_action_plan(state)
            update_state(session_id, {"action_plan": action_plan})

            plan_message = format_action_plan_message(action_plan)
            yield f"data: {json.dumps({'type': 'action_plan', 'journey_data': action_plan})}\n\n"
            await asyncio.sleep(0)
            yield f"data: {json.dumps({'type': 'token', 'content': plan_message})}\n\n"
            await asyncio.sleep(0)

            advance_stage(session_id)

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    async def secure_event_generator(gen):
        async for chunk in gen:
            if chunk.startswith("data: "):
                try:
                    data_str = chunk[6:].strip()
                    if not data_str:
                        continue
                    payload = json.loads(data_str)
                    safe_payload = SafeSSEPayload(**payload).model_dump(exclude_none=True)
                    for f in ["chain_of_thought", "system_prompt", "debug", "internal_policy"]:
                        safe_payload.pop(f, None)
                    yield f"data: {json.dumps(safe_payload)}\n\n"
                except Exception as e:
                    logger.error(f"SSE Validation Error: {e}")
            else:
                yield chunk

    return StreamingResponse(
        secure_event_generator(legal_journey_generator()),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


@router.post("", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat(request: Request, body: ChatRequest):
    """Non-streaming chat endpoint."""
    try:
        audience = _validate_audience(body.audience)
        clean_question = sanitize_input(body.question)
        check_prompt_injection(clean_question)

        safety_result = analyze_safety(clean_question)
        if safety_result.get("requires_emergency_mode"):
            return ChatResponse(
                answer=f"Emergency mode activated. Please contact authorities immediately.",
                detected_language="en",
                response_language="en",
                emergency_mode=True,
                risk_level=safety_result.get("risk_level", "EMERGENCY"),
            )

        if body.language and body.language != "auto" and body.language in LANGUAGE_NAME_MAP:
            target_lang = body.language
        else:
            target_lang = detect_language(clean_question)

        history_list = []
        if body.history:
            for m in body.history[-6:]:
                history_list.append({"role": m.role, "content": sanitize_input(m.content)})
        history_str = "\n".join([f"{h['role'].capitalize()}: {h['content']}" for h in history_list])

        session_id = body.session_id or "anonymous"
        from app.services.journey_state import add_history_message, get_history_str

        history_list = []
        if body.history:
            for m in body.history[-6:]:
                history_list.append({"role": m.role, "content": sanitize_input(m.content)})
        body_history_str = "\n".join([f"{h['role'].capitalize()}: {h['content']}" for h in history_list])
        stored_history_str = get_history_str(session_id)
        history_str = body_history_str if body_history_str else stored_history_str

        state = get_state(session_id)
        current_stage = state.get("stage", STAGE_GATHER_DETAILS)
        existing_intent = state.get("intent", "UNKNOWN")

        intent_result = await run_in_threadpool(classify_intent, clean_question, history_str)
        intent = intent_result.get("intent", "UNKNOWN")

        is_in_personal_intake = (existing_intent == "PERSONAL_LEGAL_PROBLEM" and current_stage == STAGE_GATHER_DETAILS)

        if intent in ["PERSONAL_LEGAL_PROBLEM", "EMERGENCY_LEGAL_PROBLEM"]:
            update_state(session_id, {"intent": intent})
            effective_intent = intent
        elif is_in_personal_intake:
            if len(clean_question.split()) < 6 or not any(kw in clean_question.lower() for kw in ["what is", "how do i", "explain", "documents required", "procedure"]):
                effective_intent = "PERSONAL_LEGAL_PROBLEM"
            else:
                effective_intent = intent
        else:
            effective_intent = intent

        add_history_message(session_id, "user", clean_question)

        intent_result = await run_in_threadpool(classify_intent, clean_question, history_str)
        intent = intent_result.get("intent", "CASUAL_CHAT")

        # Map legacy aliases
        if intent in ["GREETING", "UNKNOWN"]:
            intent = "CASUAL_CHAT"
        elif intent == "GENERAL_LEGAL_QUESTION":
            intent = "GENERAL_LEGAL_QUERY"
        elif intent == "DOCUMENT_RELATED_QUERY":
            intent = "DOCUMENT_QUERY"

        is_in_personal_intake = (existing_intent == "PERSONAL_LEGAL_PROBLEM" and current_stage == STAGE_GATHER_DETAILS)

        if intent in ["PERSONAL_LEGAL_PROBLEM", "EMERGENCY_LEGAL_PROBLEM"]:
            update_state(session_id, {"intent": intent})
            effective_intent = intent
        elif is_in_personal_intake:
            if len(clean_question.split()) < 6 or not any(kw in clean_question.lower() for kw in ["what is", "how do i", "explain", "documents required", "procedure"]):
                effective_intent = "PERSONAL_LEGAL_PROBLEM"
            else:
                effective_intent = intent
        else:
            effective_intent = intent

        add_history_message(session_id, "user", clean_question)

        # ── HARD INTENT GATE ──────────────────────────────────────────────────
        if not is_legal_intent(effective_intent):
            if effective_intent == "INSUFFICIENT_CONTEXT":
                answer = get_clarification_prompt(clean_question, target_lang)
                v_status = "ADVISORY"
            else:
                answer = get_greeting_message(target_lang)
                v_status = "CASUAL"

            add_history_message(session_id, "assistant", answer)
            return ChatResponse(
                answer=answer,
                detected_language=target_lang,
                response_language=LANGUAGE_NAME_MAP.get(target_lang, "English"),
                confidence_score=1.0,
                retrieval_confidence=0.0,
                verification_status=v_status,
                sources=[],
                citations=[],
            )

        if effective_intent in ["GENERAL_LEGAL_QUERY", "PROCEDURAL_QUERY", "DOCUMENT_QUERY"]:
            if effective_intent == "DOCUMENT_QUERY":
                from app.services.drafting_engine import run_drafting_engine
                answer = await run_drafting_engine(clean_question, target_lang, history_str)
                confidence = 0.9
                retrieval = 0.0
                v_status = "GENERATED"
            else:
                legal_analysis = await run_legal_analysis(None, clean_question, target_lang, history_str, audience)
                answer = format_legal_analysis_message(legal_analysis)
                confidence = 0.88
                retrieval = float(min(legal_analysis.get("sources_count", 0) / 6, 1.0))
                v_status = "GROUNDED" if legal_analysis.get("sources_count", 0) > 0 else "GENERATED"

            add_history_message(session_id, "assistant", answer)
            return ChatResponse(
                answer=answer,
                detected_language=target_lang,
                response_language=LANGUAGE_NAME_MAP.get(target_lang, "English"),
                confidence_score=confidence,
                retrieval_confidence=retrieval,
                verification_status=v_status,
            )

        existing_case = state.get("case_info", {})

        case_info = await run_in_threadpool(
            extract_case_info_real, clean_question, history_str, existing_case or None
        )
        update_state(session_id, {"case_info": case_info})

        is_complete = case_info.get("classification_status") == "COMPLETE"
        missing = case_info.get("missing_information", [])
        collected_fields = case_info.get("collected_fields", {})
        uncollected_missing = [m for m in missing if not collected_fields.get(m)]

        if not is_complete and uncollected_missing and state.get("follow_up_count", 0) < MAX_FOLLOWUP_QUESTIONS:
            asked_questions = state.get("asked_questions", [])
            target_field = uncollected_missing[0]
            
            followup_q = await run_in_threadpool(generate_smart_followup, uncollected_missing, case_info, target_lang, asked_questions)
                
            clean_asked_questions = [q for q in asked_questions if isinstance(q, dict)]
            clean_asked_questions.append({"question": followup_q, "field": target_field})
            update_state(session_id, {"follow_up_count": state.get("follow_up_count", 0) + 1, "asked_questions": clean_asked_questions})
            add_history_message(session_id, "assistant", followup_q)
            return ChatResponse(
                answer=followup_q,
                detected_language=target_lang,
                response_language=LANGUAGE_NAME_MAP.get(target_lang, "English"),
                confidence_score=0.9,
            )

        legal_analysis = await run_legal_analysis(case_info, clean_question, target_lang, history_str, audience)
        answer = format_legal_analysis_message(legal_analysis)
        add_history_message(session_id, "assistant", answer)

        return ChatResponse(
            answer=answer,
            detected_language=target_lang,
            response_language=LANGUAGE_NAME_MAP.get(target_lang, "English"),
            confidence_score=0.88,
            retrieval_confidence=float(min(legal_analysis.get("sources_count", 0) / 6, 1.0)),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error in chat endpoint: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing failed: {str(exc)}",
        )


@router.post("/journey/reset")
async def reset_journey(body: ChatRequest):
    """Reset the legal journey for a session."""
    from app.services.journey_state import reset_session
    session_id = body.session_id or "anonymous"
    reset_session(session_id)
    return {"status": "reset", "session_id": session_id}


@router.post("/journey/eligibility-answer")
async def submit_eligibility_answer(request: Request, body: dict):
    """Submit an answer to an eligibility question."""
    session_id = body.get("session_id", "anonymous")
    question_id = body.get("question_id", "")
    answer = body.get("answer", "")

    if not question_id or not answer:
        raise HTTPException(status_code=400, detail="question_id and answer required")

    state = get_state(session_id)
    profile = state.get("eligibility_profile", {})
    parsed = parse_eligibility_answer(question_id, answer)
    updated = {**profile, **parsed}
    update_state(session_id, {"eligibility_profile": updated})

    next_q = get_next_eligibility_question(updated)
    if next_q:
        return {"status": "next_question", "question": next_q}
    else:
        result = evaluate_eligibility(updated)
        update_state(session_id, {
            "eligibility_result": result.get("eligible"),
            "eligibility_reasons": result.get("reasons", []),
        })
        return {"status": "complete", "eligibility": result}
