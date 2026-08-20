import pytest
from app.services.consent_engine import ConsentEngine, ConsentBypassError

@pytest.mark.asyncio
async def test_deterministically_block_llm_consent_bypass():
    engine = ConsentEngine()
    user_id = "user_123"
    consent_type = "DATA_SHARING"
    
    # Assert missing consent raises bypass error
    with pytest.raises(ConsentBypassError) as exc_info:
        engine.verify_consent_deterministically(user_id, consent_type)
    assert "LLM attempted to bypass consent" in str(exc_info.value)
    
    # Grant consent
    await engine.request_consent(user_id, consent_type)
    
    # Assert checking passes
    assert engine.verify_consent_deterministically(user_id, consent_type) is True
