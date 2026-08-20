import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def extract_facts_from_message(message: str) -> List[Dict[str, Any]]:
    """
    Extract key facts from a given message using LLM or NLP.
    Mock implementation for now.
    """
    logger.info(f"Extracting facts from message: {message[:50]}...")
    # Mock LLM fact extraction
    return [{"fact_key": "user_statement", "fact_value": message, "confidence": 0.95}]

async def extract_memory(case_id: str, message: str) -> Dict[str, Any]:
    """
    Extracts memory and facts from a user message for a case.
    """
    facts = extract_facts_from_message(message)
    return {
        "case_id": case_id,
        "facts": facts,
        "extracted_at": "now"
    }
