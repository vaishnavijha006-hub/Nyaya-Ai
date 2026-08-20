import pytest
import asyncio
from app.services.safety import SafetyService
from tests.fixtures.mock_providers import MockProviders

@pytest.fixture
def mock_providers():
    return MockProviders()

@pytest.fixture
def safety_service(mock_providers):
    return SafetyService(
        redis_client=mock_providers.redis,
        pg_client=mock_providers.postgres,
        rag_client=mock_providers.rag,
        sms_client=mock_providers.sms
    )

@pytest.mark.anyio
async def test_normal_request(safety_service, mock_providers):
    result = await safety_service.process_query("hello there")
    assert result["status"] == "NORMAL"
    mock_providers.redis.get.assert_called_once()
    mock_providers.postgres.execute.assert_called_once()

@pytest.mark.anyio
async def test_emergency_request_success(safety_service, mock_providers):
    result = await safety_service.process_query("I need help, emergency")
    assert result["status"] == "EMERGENCY_INTERVENTION_REQUIRED"
    assert result["sms_sent"] is True
    # Bypass nonessential
    mock_providers.redis.get.assert_not_called()
    mock_providers.postgres.execute.assert_not_called()
    mock_providers.rag.search.assert_not_called()
    mock_providers.sms.send_alert.assert_called_once()

@pytest.mark.anyio
async def test_emergency_redis_timeout(safety_service, mock_providers):
    mock_providers.redis.get.side_effect = asyncio.TimeoutError()
    result = await safety_service.process_query("help")
    assert result["status"] == "EMERGENCY_INTERVENTION_REQUIRED"
    mock_providers.sms.send_alert.assert_called_once()

@pytest.mark.anyio
async def test_emergency_postgres_timeout(safety_service, mock_providers):
    mock_providers.postgres.execute.side_effect = asyncio.TimeoutError()
    result = await safety_service.process_query("help")
    assert result["status"] == "EMERGENCY_INTERVENTION_REQUIRED"
    mock_providers.sms.send_alert.assert_called_once()

@pytest.mark.anyio
async def test_emergency_rag_timeout(safety_service, mock_providers):
    mock_providers.rag.search.side_effect = asyncio.TimeoutError()
    result = await safety_service.process_query("help")
    assert result["status"] == "EMERGENCY_INTERVENTION_REQUIRED"
    mock_providers.sms.send_alert.assert_called_once()

@pytest.mark.anyio
async def test_emergency_sms_timeout(safety_service, mock_providers):
    # Setup SMS to raise TimeoutError
    async def slow_sms():
        raise asyncio.TimeoutError()
    mock_providers.sms.send_alert.side_effect = slow_sms
    
    result = await safety_service.process_query("help")
    assert result["status"] == "EMERGENCY_INTERVENTION_REQUIRED"
    assert result["sms_sent"] is False
    assert "timed out" in result["message"]

@pytest.mark.anyio
async def test_emergency_sms_failure(safety_service, mock_providers):
    mock_providers.sms.send_alert.side_effect = Exception("API down")
    result = await safety_service.process_query("help")
    assert result["status"] == "EMERGENCY_INTERVENTION_REQUIRED"
    assert result["sms_sent"] is False

@pytest.mark.anyio
async def test_normal_request_with_redis_timeout(safety_service, mock_providers):
    mock_providers.redis.get.side_effect = asyncio.TimeoutError()
    with pytest.raises(asyncio.TimeoutError):
        await safety_service.process_query("just checking")
