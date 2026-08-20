import json
from .llm import ask_llm

def analyze_authority_response(case_details, response_text):
    """
    Analyzes an authority's response. Flags ambiguous as HUMAN_REVIEW_REQUIRED.
    """
    prompt = f"""
    Analyze the following response from an authority regarding a case.
    Case Details: {case_details}
    Authority Response: {response_text}
    
    Determine the response status: FAVORABLE, UNFAVORABLE, AMBIGUOUS.
    If AMBIGUOUS, output HUMAN_REVIEW_REQUIRED as the status instead.
    
    Provide output as JSON:
    {{
        "response_status": "FAVORABLE|UNFAVORABLE|HUMAN_REVIEW_REQUIRED",
        "analysis_details": {{"reason": "..."}}
    }}
    """
    response_text = ask_llm(prompt)
    try:
        return json.loads(response_text.strip('```json\n').strip('```'))
    except:
        return {"response_status": "HUMAN_REVIEW_REQUIRED", "analysis_details": {"reason": "Parsing failed"}}
