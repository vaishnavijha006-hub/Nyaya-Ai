from .source_verification import SourceVerificationEngine
from .legal_versioning import LegalVersioningEngine
from .source_trust import SourceTrustManager

def ingest_document(document: dict, db_session):
    """
    Ingest a legal document into the vector database using the new TRUST pipeline.
    """
    verifier = SourceVerificationEngine(db_session)
    versioner = LegalVersioningEngine(db_session)
    trust_manager = SourceTrustManager(db_session)
    
    # Verify provenance
    provenance = verifier.verify_provenance(
        origin_url=document.get('url'),
        content=document.get('content'),
        publisher=document.get('publisher'),
        digital_signature=document.get('signature')
    )
    
    # Calculate trust score
    trust_score = trust_manager.calculate_trust_score(
        source_version_id=None,
        publisher=document.get('publisher'),
        reviews=[]
    )
    
    # Create new version
    version = versioner.create_new_version(
        source_id=document.get('source_id'),
        title=document.get('title'),
        content=document.get('content'),
        effective_date=document.get('effective_date')
    )
    
    # TODO: Save to vector database with trust score and provenance
    pass
