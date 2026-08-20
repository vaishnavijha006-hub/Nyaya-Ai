import logging
from typing import Dict, Any
from app.services.memory_extractor import extract_memory
from app.services.change_detector import detect_changes
from app.services.memory_reconciliation import reconcile_memory
from app.services.case_summary_engine import generate_case_summary

logger = logging.getLogger(__name__)

async def process_case_memory(case_id: str, message: str) -> Dict[str, Any]:
    """
    Main pipeline for Ekjut Persistent Case Memory Engine.
    1. Extract new facts from message
    2. Detect changes/conflicts with existing memory
    3. Reconcile and flag material conflicts as CONFLICT
    4. Generate summary if successful
    """
    logger.info(f"Processing case memory for case {case_id}")
    
    # 1. Extract memory
    extraction = await extract_memory(case_id, message)
    new_facts = extraction.get("facts", [])
    
    # Existing memory mock
    existing_facts = []
    
    # 2. Detect changes
    changes = detect_changes(existing_facts, new_facts)
    
    # 3. Reconcile
    reconciliation = reconcile_memory(case_id, new_facts, changes.get("conflicts", []))
    
    if reconciliation.get("status") == "CONFLICT":
        return reconciliation
        
    # 4. Generate summary
    summary = await generate_case_summary(case_id, "mock narrative", new_facts)
    
    return {
        "status": "SUCCESS",
        "summary": summary,
        "facts_added": len(new_facts)
    }
