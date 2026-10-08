import pytest
from app.services.intent_classifier import (
    classify_intent, _heuristic_classify_intent, is_legal_intent,
    get_greeting_message, get_clarification_prompt
)

def test_casual_chat_inputs():
    casual_inputs = ["hii", "hello", "good morning", "thanks", "okay", "what's up"]
    for inp in casual_inputs:
        res = _heuristic_classify_intent(inp)
        assert res["intent"] == "CASUAL_CHAT", f"Failed for casual input: {inp}"
        assert not is_legal_intent(res["intent"]), f"Casual input marked as legal intent: {inp}"

def test_casual_chat_response():
    msg = get_greeting_message("en")
    assert "Nyaya AI" in msg
    assert "Bharatiya Sakshya Adhiniyam" not in msg
    assert "Motor Vehicles Act" not in msg
    assert "Puttaswamy" not in msg

def test_insufficient_context_inputs():
    ambiguous_inputs = ["help", "rent", "police", "court", "money"]
    for inp in ambiguous_inputs:
        res = _heuristic_classify_intent(inp)
        assert res["intent"] == "INSUFFICIENT_CONTEXT", f"Failed for ambiguous input: {inp}"
        assert not is_legal_intent(res["intent"]), f"Ambiguous input marked as legal intent: {inp}"
        prompt = get_clarification_prompt(inp, "en")
        assert len(prompt) > 20, f"Clarification prompt too short for: {inp}"

def test_general_legal_query():
    query = "What is Section 138 of the Negotiable Instruments Act?"
    res = _heuristic_classify_intent(query)
    assert res["intent"] in ["GENERAL_LEGAL_QUERY", "GENERAL_LEGAL_QUESTION"]
    assert is_legal_intent(res["intent"])

def test_personal_legal_problem():
    problem = "My landlord locked me out and won't return my ₹50,000 deposit."
    res = _heuristic_classify_intent(problem)
    assert res["intent"] == "PERSONAL_LEGAL_PROBLEM"
    assert is_legal_intent(res["intent"])

if __name__ == "__main__":
    test_casual_chat_inputs()
    test_casual_chat_response()
    test_insufficient_context_inputs()
    test_general_legal_query()
    test_personal_legal_problem()
    print("ALL INTENT GATE REGRESSION TESTS PASSED SUCCESSFULLY!")
