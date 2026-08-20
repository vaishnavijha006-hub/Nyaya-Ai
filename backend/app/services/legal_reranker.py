def rerank_documents(query: str, documents: list) -> list:
    """
    Rerank documents based on relevance, trust scores, and effective dates.
    """
    for doc in documents:
        # Heavily penalize or restrict user evidence if treated as legal authority
        if doc.get('publisher') == 'user':
            doc['is_legal_authority'] = False
            # Cap the relevance score for user evidence
            doc['relevance_score'] = min(doc.get('relevance_score', 0), 49.0)
        else:
            doc['is_legal_authority'] = True
            
        # Adjust score based on trust score
        trust_score = doc.get('trust_score', 0)
        relevance = doc.get('relevance_score', 0)
        
        # Simple weighted combination
        doc['final_score'] = (relevance * 0.7) + (trust_score * 0.3)
        
    # Sort by final score descending
    reranked = sorted(documents, key=lambda x: x.get('final_score', 0), reverse=True)
    return reranked
