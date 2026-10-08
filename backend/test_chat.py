from app.services.intent_classifier import _heuristic_classify_intent, get_greeting_message

def test_greeting_classification():
    res = _heuristic_classify_intent("hii")
    assert res["intent"] == "GREETING"
    
    res_hello = _heuristic_classify_intent("hello nyaya")
    assert res_hello["intent"] == "GREETING"

def test_greeting_message():
    msg = get_greeting_message("en")
    assert "Nyaya AI" in msg
    assert "Bharatiya Sakshya Adhiniyam" not in msg

if __name__ == "__main__":
    test_greeting_classification()
    test_greeting_message()
    print("ALL GREETING TESTS PASSED SUCCESSFULLY!")

