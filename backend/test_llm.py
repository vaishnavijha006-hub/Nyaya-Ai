from app.services.llm import LLMService

llm_service = LLMService()
# Note: Since the test relies on Groq API, this might still fail if there's no API key.
# We're just making sure the code is structurally correct.
try:
    response = llm_service.ask_llm_rag("Who is the Prime Minister of India?", context="", language="en", audience="general")
    print(response)
except Exception as e:
    print(f"Failed to call LLM API: {e}")