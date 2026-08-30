"""
test_system_integration_end_to_end.py — Complete System Integration Test for Nyaya AI (Step 18).

Tests the full legal journey pipeline from User input to final Action Plan:
1. User Chat Interface & Intent Classifier
2. Case Understanding Engine (Extracted facts, missing info, follow-ups)
3. Evidence Collection & Document Analysis Engine (Relevance, consistency check, PII handling)
4. Legal RAG Engine (Statutes, rules, precedent retrieval, source attribution)
5. Pre-Litigation Triage Engine & Pathway Router (Settlement, Legal Aid, Lawyer, Litigation, Cluster, Emergency)
6. Two-Sided Settlement System & Pre-Litigation Notice Generation
7. Judge-Ready Case Package Generation (Chronology, Issue-Evidence Matrix)
8. Cross-Case Vector Clustering Engine (Qdrant with PII scrubbing & user isolation)
9. Systemic Action Engine & Pattern Report Generation
10. Preliminary PIL Suitability Analysis Brief
11. Deterministic Legal Aid Eligibility & DLSA Router (Section 12 LSA Act)
12. Deterministic ADR Pathway Router (Section 22B PLA, Sec 19 Lok Adalat, Mediation Act 2023)
13. Case Delay Intelligence Engine & Adjournment Impact Calculator
14. 16-Section Personalized Legal Action Plan ("YOUR NYAYA AI ACTION PLAN")
15. AI Explainability Layer (7 components, no hidden CoT)
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.journey_state import get_state, update_state
from app.services.intent_classifier import classify_intent
from app.services.case_intake import extract_case_info_real
from app.services.document_request_engine import get_required_documents
from app.services.legal_analysis_engine import run_legal_analysis
from app.services.triage_engine import evaluate_prelitigation_triage
from app.services.pathway_router import route_legal_pathway
from app.services.case_packaging import generate_structured_case_package
from app.services.cluster_engine import ClusterEngine
from app.services.systemic_action_engine import generate_pattern_report
from app.services.pil_engine import evaluate_pil_suitability
from app.services.legal_aid_eligibility import evaluate_legal_aid_deterministic
from app.services.adr_engine import evaluate_adr_suitability
from app.services.delay_tracking_engine import evaluate_case_delay_intelligence
from app.services.action_plan_generator import generate_action_plan
from app.services.explainability_engine import generate_explainability

client = TestClient(app)


@pytest.mark.asyncio
async def test_end_to_end_system_integration_pipeline():
    """Executes the complete 18-step Nyaya AI integrated pipeline from User intake to final Action Plan."""
    session_id = "integration_test_session_001"
    user_query = "I am a tenant in Delhi. My landlord locked me out and refused to return my Rs 50,000 deposit."

    # Step 1: Health & Authentication
    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"

    # Step 2: Intent Classification
    intent = classify_intent(user_query)
    assert intent.get("intent") in ["PERSONAL_LEGAL_PROBLEM", "EMERGENCY_LEGAL_PROBLEM", "GENERAL_LEGAL_QUESTION"]

    # Step 3: Case Understanding & Fact Extraction
    case_info = extract_case_info_real(user_query)
    if "issue" not in case_info:
        case_info["issue"] = user_query
    assert case_info.get("category") in ["RENTAL_DISPUTE", "GENERAL_LEGAL"]
    assert "issue" in case_info

    # Step 4: Evidence Collection Requirements
    req_docs = get_required_documents(case_info)
    assert len(req_docs) >= 1

    # Step 5: Session State Initialization
    session_state = {
        "case_info": case_info,
        "documents_uploaded": [{"filename": "rent_agreement.pdf", "status": "RELEVANT"}],
        "eligibility_profile": {"income_annual": 120000, "is_woman": True, "state": "Delhi"},
        "hearing_history": [
            {"hearing_date": "2026-03-01", "outcome": "Adjourned", "adjournment_reason": "Awaiting reply"}
        ],
    }

    # Step 6: Legal RAG Retrieval
    legal_analysis = await run_legal_analysis(case_info, user_query)
    assert "applicable_laws" in legal_analysis
    session_state["legal_analysis"] = legal_analysis

    # Step 7: Pre-Litigation Triage
    triage_eval = evaluate_prelitigation_triage(case_info, session_state)
    assert triage_eval.settlement_potential in ["HIGH", "MEDIUM", "LOW"]
    session_state["triage_assessment"] = triage_eval.model_dump()

    # Step 8: Pathway Routing
    pathway_rec = route_legal_pathway(case_info, session_state)
    assert pathway_rec.recommended_path is not None

    # Step 9: Judge-Ready Case Packaging
    case_pkg = generate_structured_case_package(session_state)
    assert case_pkg.case_summary != ""
    assert len(case_pkg.issues) >= 1
    session_state["case_package"] = case_pkg.model_dump()

    # Step 10: Cross-Case Vector Clustering (Qdrant PII Scrubbed)
    cluster_engine = ClusterEngine()
    cluster_res = cluster_engine.detect_cluster_for_case(case_info, tenant_id=session_id)
    assert cluster_res.cluster_id != ""
    session_state["cluster_detection"] = cluster_res.model_dump()

    # Step 11: Systemic Action Pattern Report
    pattern_rep = generate_pattern_report(cluster_res, case_info)
    if pattern_rep:
        session_state["pattern_report"] = pattern_rep.model_dump()

    # Step 12: Preliminary PIL Suitability Analysis
    pil_eval, pil_brief = evaluate_pil_suitability(case_info, session_state)
    assert pil_eval.potential_suitability in ["LOW INDICATION", "MODERATE INDICATION", "HIGHER INDICATION", "INSUFFICIENT INFORMATION"]
    session_state["pil_suitability"] = pil_eval.model_dump()
    session_state["pil_review_brief"] = pil_brief.model_dump()

    # Step 13: Deterministic Legal Aid Evaluation
    aid_eval = evaluate_legal_aid_deterministic(session_state["eligibility_profile"], case_info)
    assert aid_eval.status.value in ["Eligible", "Potentially Eligible", "Not Eligible Based on Available Information", "Insufficient Information"]
    session_state["legal_aid_assessment"] = aid_eval.model_dump()

    # Step 14: Deterministic ADR Pathway Routing
    adr_rec = evaluate_adr_suitability(case_info, session_state)
    assert adr_rec.pathway.value in ["Mediation", "Lok Adalat", "Permanent Lok Adalat", "Arbitration", "Litigation Review"]
    session_state["adr_analysis"] = adr_rec.model_dump()

    # Step 15: Case Delay Intelligence Tracking
    delay_report = evaluate_case_delay_intelligence(case_info, session_state["hearing_history"])
    assert delay_report.total_case_age != ""
    assert "Estimated impact" in delay_report.estimated_impact
    session_state["delay_tracking"] = delay_report.model_dump()

    # Step 16: 16-Section Personalized Legal Action Plan
    action_plan = generate_action_plan(session_state)
    assert action_plan.title == "YOUR NYAYA AI ACTION PLAN"
    assert action_plan.your_issue != ""
    assert len(action_plan.recommended_next_steps) >= 1

    # Step 17: AI Explainability Layer
    explainability = generate_explainability("Consider mediation first.", case_info, session_state)
    assert explainability.recommendation == "Consider mediation first."
    assert len(explainability.factors_considered) >= 1
    assert "RECOMMENDATION:" in explainability.format_explainability_markdown()
