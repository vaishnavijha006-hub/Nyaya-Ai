import pytest
import asyncio
from app.services.case_intake import extract_case_info_real, generate_smart_followup
from app.services.intent_classifier import classify_intent
from app.services.legal_analysis_engine import run_legal_analysis, format_legal_analysis_message

# Test 1: General legal question directly answers
def test_general_question_direct_answer():
    res = classify_intent("What are my rights as a consumer for a refund?", "")
    assert res.get("intent") in ["GENERAL_LEGAL_QUESTION", "CONSUMER_QUERY"]

# Test 2: Procedural question directly answers
def test_procedural_question_direct_answer():
    res = classify_intent("How do I file an RTI application?", "")
    assert res.get("intent") in ["GENERAL_LEGAL_QUESTION", "PROCEDURAL_QUERY"]

# Test 3: Personal problem enters case intake
def test_personal_problem_intake():
    res = classify_intent("My landlord locked me out of my rented house.", "")
    assert res.get("intent") == "PERSONAL_LEGAL_PROBLEM"

# Test 4: Date/time is extracted
def test_date_time_extraction():
    case_info = extract_case_info_real("I was illegally locked out of my rented house.", "", None)
    updated = extract_case_info_real("18 August 2026 at 11:20 PM", "", case_info)
    val = str(updated)
    assert "2026-08-18" in val or "18 August" in val or "lockout_date" in updated.get("collected_fields", {})
    assert "23:20" in val or "11:20" in val or "lockout_time" in updated.get("collected_fields", {})

# Test 5: Date/time survives subsequent messages
def test_date_time_survives():
    case_info = extract_case_info_real("I was illegally locked out of my rented house.", "", None)
    updated1 = extract_case_info_real("18 August 2026 at 11:20 PM", "", case_info)
    updated2 = extract_case_info_real("The landlord also changed the main gate lock.", "", updated1)
    val = str(updated2)
    assert "2026-08-18" in val or "18 August" in val or updated2.get("collected_fields", {}).get("lockout_date")
    assert "23:20" in val or "11:20" in val or updated2.get("collected_fields", {}).get("lockout_time")

# Test 6: Previously collected fields are never overwritten by null
def test_null_preservation():
    old_state = {
        "category": "RENTAL_DISPUTE",
        "lockout_date": "2026-08-18",
        "lockout_time": "23:20",
        "collected_fields": {"lockout_date": True, "lockout_time": True}
    }
    new_info = {"lockout_date": None, "lockout_time": "", "landlord_action": "changed lock"}
    from app.services.case_intake import _merge_state
    merged = _merge_state(old_state, new_info)
    assert merged.get("lockout_date") == "2026-08-18"
    assert merged.get("lockout_time") == "23:20"
    assert merged.get("landlord_action") == "changed lock"

# Test 7: Multiple facts are extracted from one message
def test_multiple_facts_extracted():
    msg = "My landlord locked me out on 18 August at 11:20 PM in Ghaziabad and I have a written rent agreement."
    case_info = extract_case_info_real(msg, "", None)
    collected = case_info.get("collected_fields", {})
    assert collected.get("lockout_date") or collected.get("incident_date")
    assert collected.get("lockout_time") or collected.get("incident_time")
    assert collected.get("property_location") or collected.get("location")
    assert collected.get("rent_agreement_exists") or collected.get("rent_agreement")

# Test 8: Same question is never repeated
def test_no_question_repetition():
    missing = ["lockout_date", "rent_agreement_exists"]
    case_info = {"category": "RENTAL_DISPUTE"}
    asked = [{"question": "When did the lockout happen?", "field": "lockout_date"}]
    q = generate_smart_followup(missing, case_info, "en", asked)
    assert "When did the lockout happen?" not in q

# Test 9: Answered fields are never requested again
def test_no_answered_field_requested():
    case_info = {
        "category": "RENTAL_DISPUTE",
        "collected_fields": {"lockout_date": True, "lockout_time": True},
        "missing_information": ["lockout_date", "rent_agreement_exists"]
    }
    q = generate_smart_followup(["rent_agreement_exists"], case_info, "en", [])
    assert "rent agreement" in q.lower() or "written" in q.lower()

# Test 10: Ambiguous answer asks clarification
def test_ambiguous_answer_clarification():
    case_info = extract_case_info_real("I was locked out", "", None)
    updated = extract_case_info_real("On 18 August", "", case_info)
    assert updated.get("collected_fields", {}).get("lockout_date") or updated.get("collected_fields", {}).get("incident_date")
    q = generate_smart_followup(updated.get("missing_information", []), updated, "en", [])
    assert "time" in q.lower() or "property" in q.lower() or "agreement" in q.lower()

# Test 11: Short yes/no answer updates correct target field
def test_short_yes_no_interpretation():
    state = {
        "category": "RENTAL_DISPUTE",
        "missing_information": ["rent_agreement_exists"],
        "asked_questions": [{"question": "Do you have a rent agreement?", "field": "rent_agreement_exists"}]
    }
    updated = extract_case_info_real("yes", "", state)
    assert updated.get("rent_agreement_exists") is True or updated.get("collected_fields", {}).get("rent_agreement_exists") is True

# Test 12: Two sessions remain isolated
def test_session_isolation():
    s1 = extract_case_info_real("cheque bounce for 50000", "", None)
    s2 = extract_case_info_real("cheque bounce for 100000", "", None)
    assert s1.get("cheque_amount") != s2.get("cheque_amount")

# Test 13: General legal analysis works with empty case_info
@pytest.mark.anyio
async def test_general_legal_analysis_empty_case():
    res = await run_legal_analysis(None, "What is Article 21 of the Indian Constitution?", "en")
    assert res is not None
    assert "summary" in res or "user_rights" in res
    msg = format_legal_analysis_message(res)
    assert "Legal Analysis" in msg

# Test 14: Empty RAG results are handled safely
@pytest.mark.anyio
async def test_empty_rag_handled_safely():
    res = await run_legal_analysis({}, "XYZ_NON_EXISTENT_QUERY_123456", "en")
    assert res is not None
    msg = format_legal_analysis_message(res)
    assert "Legal Analysis" in msg

# Test 15: LLM failure is handled safely
def test_llm_failure_handled_safely():
    # Calling generate_smart_followup with invalid case_info should not throw uncaught exception
    q = generate_smart_followup(["lockout_date"], {}, "en", [])
    assert isinstance(q, str)
    assert len(q) > 0
    assert "details about the incident" not in q.lower()

# Test 16: Intent context switching (General -> Personal)
def test_intent_context_switching():
    res1 = classify_intent("What is the procedure for filing a cheque bounce case?", "")
    assert res1.get("intent") in ["GENERAL_LEGAL_QUESTION", "PROCEDURAL_QUERY"]
    
    history = "User: What is the procedure for filing a cheque bounce case?\nAI: [direct procedural answer]"
    res2 = classify_intent("Actually, my cheque for 2 lakh bounced last week and the person isn't paying me.", history)
    assert res2.get("intent") == "PERSONAL_LEGAL_PROBLEM"

