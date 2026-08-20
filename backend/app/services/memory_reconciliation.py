import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def reconcile_memory(case_id: str, new_facts: list, conflicts: list) -> Dict[str, Any]:
    """
    Reconciles new facts with existing memory, handling conflicts.
    Flag material conflicts as 'CONFLICT' requiring user confirmation.
    """
    if conflicts:
        logger.warning(f"Material conflict detected for case {case_id}")
        return {
            "status": "CONFLICT",
            "message": "We noticed a contradiction in the details provided. Please clarify.",
            "conflicts": conflicts
        }
        
    logger.info(f"Memory reconciled successfully for case {case_id}")
    return {
        "status": "SUCCESS",
        "updated_facts": new_facts
    }
