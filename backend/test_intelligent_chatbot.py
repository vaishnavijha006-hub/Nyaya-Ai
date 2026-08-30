"""
test_intelligent_chatbot.py — Unit tests for Step 3 Intelligent Legal Chatbot.

Verifies:
1. Intent Classification (General, Personal, Procedural, Document, Emergency)
2. Fact Extraction (dates, times, locations, parties, documents)
3. Session Persistence (journey_state store across turns)
4. Duplicate Question Prevention (tracking asked_questions and collected_fields)
5. Multi-Turn Conversation Intake (Intake progression without fact loss)
6. Emergency Routing (Safety concern detection)
"""
import pytest
from app.services.intent_classifier import classify_intent
from app.services.case_intake import (
    _heuristic_fact_extraction,
    _merge_state,
    extract_case_info_real,
    generate_smart_followup,
)
from app.services.journey_state import (
    get_state,
    update_state,
    reset_session,
)


def test_1_intent_classification():
    """Test 1: Distinguishes between General, Personal, Procedural, Document, and Emergency intents."""
    # A. General Legal Question
    res_general = classify_intent("What is a rent agreement?")
    assert res_general["intent"] == "GENERAL_LEGAL_QUESTION"

    # B. Personal Legal Problem
    res_personal = classify_intent("My landlord locked me out.")
    assert res_personal["intent"] == "PERSONAL_LEGAL_PROBLEM"

    # C. Procedural Question
    res_procedural = classify_intent("How do I file a consumer complaint?")
    assert res_procedural["intent"] == "PROCEDURAL_QUERY"

    # D. Document-Related Question
    res_doc = classify_intent("Can you make a legal notice?")
    assert res_doc["intent"] == "DOCUMENT_RELATED_QUERY"

    # E. Emergency Situation
    res_emergency = classify_intent("My husband is threatening me right now.")
    assert res_emergency["intent"] == "EMERGENCY_LEGAL_PROBLEM"


def test_2_fact_extraction():
    """Test 2: Extracts date, time, location, parties, and booleans from user message."""
    user_msg = "My landlord Mr. Ramesh locked me out on 18 August 2026 at 11:20 PM in Delhi."
    extracted = _heuristic_fact_extraction(user_msg)

    assert "18 August 2026" in extracted.get("incident_date", "")
    assert "23:20" in extracted.get("incident_time", "") or "11:20 PM" in extracted.get("incident_time", "")
    assert extracted.get("location") == "Delhi"
    assert "Mr. Ramesh" in extracted.get("parties", "") or "Landlord" in user_msg


def test_3_session_persistence():
    """Test 3: Case state persists across turns without losing previously collected facts."""
    session_id = "test_persistence_sess_001"
    reset_session(session_id)

    # Turn 1
    s1 = update_state(session_id, {
        "intent": "PERSONAL_LEGAL_PROBLEM",
        "case_info": {"category": "RENTAL_DISPUTE", "issue": "Illegally locked out by landlord"},
    })
    assert s1["case_info"]["category"] == "RENTAL_DISPUTE"

    # Turn 2
    s2 = update_state(session_id, {
        "case_info": {"lockout_date": "18 August 2026", "location": "Delhi"},
    })
    # Check turn 1 facts are preserved
    assert s2["case_info"]["category"] == "RENTAL_DISPUTE"
    assert s2["case_info"]["issue"] == "Illegally locked out by landlord"
    # Check turn 2 facts added
    assert s2["case_info"]["lockout_date"] == "18 August 2026"
    assert s2["case_info"]["location"] == "Delhi"


def test_4_duplicate_question_prevention():
    """Test 4: System prevents re-asking questions already in asked_questions or collected_fields."""
    missing_info = ["lockout_date", "property_location", "rent_agreement_exists"]
    case_info = {"category": "RENTAL_DISPUTE"}
    asked_questions = [
        {"field": "lockout_date", "question": "When did the lockout happen?"}
    ]

    # Next followup should target property_location, NOT lockout_date
    q = generate_smart_followup(missing_info, case_info, asked_questions=asked_questions)
    assert "When did the lockout happen" not in q
    assert "location" in q.lower() or "property" in q.lower() or "where" in q.lower()


def test_5_multi_turn_conversation_intake():
    """Test 5: Multi-turn intake updates state cleanly without overwriting existing facts."""
    old_state = {
        "category": "RENTAL_DISPUTE",
        "issue": "Lockout from rented apartment",
        "collected_fields": {"category": True, "issue": True},
        "missing_information": ["lockout_date", "lockout_time", "property_location"],
    }
    new_facts = {
        "lockout_date": "2026-08-18",
        "lockout_time": "23:20",
    }

    merged = _merge_state(old_state, new_facts)
    assert merged["category"] == "RENTAL_DISPUTE"
    assert merged["issue"] == "Lockout from rented apartment"
    assert merged["lockout_date"] == "2026-08-18"
    assert merged["collected_fields"].get("lockout_date") is True
    assert "lockout_date" not in merged["missing_information"]


def test_6_emergency_routing():
    """Test 6: Emergency input flags immediate safety concern."""
    msg = "My landlord is physically attacking me and threatening violence right now!"
    classification = classify_intent(msg)
    assert classification["intent"] == "EMERGENCY_LEGAL_PROBLEM"
