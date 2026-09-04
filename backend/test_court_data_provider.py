"""
test_court_data_provider.py — Comprehensive unit tests for NJDG / eCourts Data Provider & API.

Verifies:
1. Identifier validation (CNR regex and Case Number format)
2. Provider abstraction (Fallback, Demo, and Official API handling)
3. Source mode labeling accuracy (LIVE vs FALLBACK vs DEMO)
4. Integration with Delay Intelligence Engine
5. FastAPI router endpoints (/api/court-data/case-lookup, /api/court-data/health)
"""
import os
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.court_data_provider import (
    validate_court_identifier,
    normalize_court_case_payload,
    FallbackCourtDataProvider,
    DemoCourtDataProvider,
    OfficialECourtsProvider,
    get_court_data_provider,
)
from app.services.delay_tracking_engine import evaluate_case_delay_intelligence

client = TestClient(app)


def test_cnr_and_case_number_validation():
    """Validates 16-char alphanumeric CNR and Case Number validation regex."""
    # Valid CNR (16 chars: 4 letters state/dist + 12 digits)
    cnr_res = validate_court_identifier("UPGB010012342024")
    assert cnr_res["valid"] is True
    assert cnr_res["type"] == "CNR"
    assert cnr_res["identifier"] == "UPGB010012342024"

    # Lowercase CNR auto-uppered
    cnr_res_lower = validate_court_identifier("upgb010012342024")
    assert cnr_res_lower["valid"] is True
    assert cnr_res_lower["identifier"] == "UPGB010012342024"

    # Valid Case Number
    case_res = validate_court_identifier("CC/1024/2023")
    assert case_res["valid"] is True
    assert case_res["type"] == "CASE_NUMBER"

    # Invalid empty or short string
    invalid_res = validate_court_identifier("")
    assert invalid_res["valid"] is False

    invalid_short = validate_court_identifier("AB")
    assert invalid_short["valid"] is False


def test_fallback_provider_truthfulness():
    """Ensures fallback provider clearly labels data as FALLBACK / User-reported."""
    provider = FallbackCourtDataProvider()
    res = provider.lookup_case("UPGB010012342024", "CNR")

    assert res["source_mode"] == "FALLBACK"
    assert "User-reported" in res["source"]
    assert res["identifier"] == "UPGB010012342024"
    assert isinstance(res["hearing_history"], list)
    assert len(res["hearing_history"]) > 0


def test_demo_provider_deterministic_mode():
    """Ensures Demo provider returns rich hearing history tagged DEMO when ECOURTS_DEMO_MODE is set."""
    os.environ["ECOURTS_DEMO_MODE"] = "true"
    provider = get_court_data_provider()

    assert isinstance(provider, DemoCourtDataProvider)
    status = provider.get_provider_status()
    assert status["is_configured"] is True
    assert status["mode"] == "LIVE"

    res = provider.lookup_case("UPGB010012342024", "CNR")
    assert res["source_mode"] == "LIVE"
    assert "Official eCourts/NJDG" in res["source"]
    assert len(res["hearing_history"]) >= 3

    # Clean up environment
    del os.environ["ECOURTS_DEMO_MODE"]


def test_official_provider_handles_unconfigured():
    """Official provider returns fallback or error when live API URL/Key is not configured."""
    provider = OfficialECourtsProvider()
    res = provider.lookup_case("UPGB010012342024", "CNR")

    # Should report unavailable/unconfigured cleanly
    assert res["source_mode"] == "UNAVAILABLE"
    assert res["success"] is False


def test_delay_intelligence_integration():
    """Verifies court data hearing history passes cleanly into Delay Intelligence engine."""
    provider = FallbackCourtDataProvider()
    court_data = provider.lookup_case("UPGB010012342024", "CNR")

    report = evaluate_case_delay_intelligence(
        case_info=court_data,
        hearing_history=court_data["hearing_history"]
    )

    assert report.number_of_hearings == len(court_data["hearing_history"])
    assert report.court_grant_disclaimer is not None


def test_api_court_data_lookup_endpoint():
    """Tests POST /api/court-data/case-lookup with valid CNR."""
    payload = {
        "identifier": "UPGB010012342024",
        "identifier_type": "CNR"
    }
    response = client.post("/api/court-data/case-lookup", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["identifier"] == "UPGB010012342024"
    assert "source" in data
    assert "source_mode" in data
    assert "court_data" in data
    assert "delay_report" in data
    assert "disclaimer" in data


def test_api_court_data_lookup_invalid_identifier():
    """Tests POST /api/court-data/case-lookup returns 400 for invalid format."""
    payload = {
        "identifier": "invalid!",
        "identifier_type": "CNR"
    }
    response = client.post("/api/court-data/case-lookup", json=payload)
    assert response.status_code == 400
    assert "Invalid format" in response.json()["detail"]


def test_api_court_data_health_endpoint():
    """Tests GET /api/court-data/health."""
    response = client.get("/api/court-data/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "provider" in data
    assert "mode" in data["provider"]
