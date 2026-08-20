def build_legal_query(case_info: dict, original_query: str) -> dict:
    """
    Build a specialized query for legal document retrieval.
    Extracts keywords, entities, and filters from case info.
    """
    return {
        "optimized_query": original_query,
        "keywords": case_info.get("entities", []),
        "filters": {}
    }
