from datetime import datetime

async def retrieve_legal_documents(query_info: dict, min_trust_score: float = 50.0) -> list:
    """
    Hybrid BM25 + Vector retrieval for legal sources.
    Filters based on trust scores and effective dates.
    """
    # Mock retrieval logic
    documents = query_info.get('mock_documents', [])
    
    filtered_docs = []
    current_date = datetime.now()
    incident_start_date = query_info.get('incident_start_date', current_date)
    
    for doc in documents:
        # Filter based on trust score
        if doc.get('trust_score', 0) < min_trust_score:
            print(f"REJECTED SOURCE: Trust score {doc.get('trust_score')} < {min_trust_score}. Source ID: {doc.get('id', 'Unknown')}")
            continue
            
        # Prevent user evidence from being legal authority
        if doc.get('publisher') == 'user':
            doc['is_legal_authority'] = False
        else:
            doc['is_legal_authority'] = True
            
        # Filter based on effective date
        effective_date = doc.get('effective_date')
        superseded_date = doc.get('superseded_date')
        
        if effective_date and effective_date > incident_start_date:
            print(f"REJECTED SOURCE: Not yet effective on incident date. Source ID: {doc.get('id', 'Unknown')}")
            continue
            
        if superseded_date and superseded_date < incident_start_date:
            if doc.get('is_transitional') and (incident_start_date - superseded_date).days < 365 * 3:
                pass
            else:
                print(f"REJECTED SOURCE: Superseded before incident date. Source ID: {doc.get('id', 'Unknown')}")
                continue
            
        filtered_docs.append(doc)
        
    return filtered_docs
