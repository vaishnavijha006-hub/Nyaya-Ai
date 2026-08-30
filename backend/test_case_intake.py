import pytest
from app.services.case_intake import extract_case_info_real, generate_smart_followup
from app.services.journey_state import get_state, update_state, reset_session

@pytest.mark.asyncio
async def test_followup_bug():
    session_id = "test_session_123"
    reset_session(session_id)
    
    # 1. Initial State
    initial_user_input = "I have been illegally locked out of my rented house"
    state = get_state(session_id)
    
    case_info = extract_case_info_real(initial_user_input, "", state.get("case_info"))
    update_state(session_id, {"case_info": case_info})
    
    missing = case_info.get("missing_information", [])
    assert len(missing) > 0, "Should have missing information"
    
    # Generate first question
    asked_questions = state.get("asked_questions", [])
    first_q = generate_smart_followup(missing, case_info, "en", asked_questions)
    asked_questions.append(first_q)
    update_state(session_id, {"asked_questions": asked_questions})
    
    # 2. User provides Date/Time
    second_user_input = "18 August 2026 at 11:20 PM"
    history = f"User: {initial_user_input}\nAI: {first_q}"
    
    state = get_state(session_id)
    new_case_info = extract_case_info_real(second_user_input, history, state.get("case_info"))
    update_state(session_id, {"case_info": new_case_info})
    
    # 3. Date/time is stored in session
    collected_fields = new_case_info.get("collected_fields", {})
    assert len(collected_fields) > 0, "Should have collected fields"
    
    # 4. Next question is different
    missing2 = new_case_info.get("missing_information", [])
    asked_questions2 = get_state(session_id).get("asked_questions", [])
    second_q = generate_smart_followup(missing2, new_case_info, "en", asked_questions2)
    
    assert second_q != first_q, "The follow-up question should not be repeated"
    assert second_q not in asked_questions2, "The new question should not be in the previously asked list"
    
    # 5. Multiple facts extracted
    third_user_input = "My landlord is Mr. Sharma and the rent was 15000"
    history2 = history + f"\nUser: {second_user_input}\nAI: {second_q}"
    new_case_info3 = extract_case_info_real(third_user_input, history2, new_case_info)
    assert new_case_info3.get("parties") is not None
    
    # 6. Separate sessions
    session_id2 = "test_session_456"
    reset_session(session_id2)
    state2 = get_state(session_id2)
    assert not state2.get("case_info").get("parties"), "Different session should have different state"
