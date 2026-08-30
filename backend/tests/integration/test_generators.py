import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_rti_generator():
    response = client.post("/rti/generate", json={
        "department": "Police",
        "public_authority": "DCP",
        "information_required": "Number of FIRs in 2025",
        "applicant_name": "John Doe",
        "language": "en"
    })
    assert response.status_code == 200
    data = response.json()
    assert "FIR" in data["application"] or "First Information Report" in data["application"]

def test_legal_notice_generator():
    response = client.post("/legal-notice/generate", json={
        "sender_name": "Tenant",
        "sender_address": "Apt 1",
        "recipient_name": "Landlord",
        "recipient_address": "Apt 2",
        "notice_type": "Eviction",
        "case_details": "Illegal lock out",
        "legal_demand": "Open door",
        "language": "en"
    })
    assert response.status_code == 200
    data = response.json()
    assert "Tenant" in data["notice"]
    assert "Landlord" in data["notice"]
    assert "door" in data["notice"].lower()

def test_contract_generator():
    response = client.post("/contract/generate", json={
        "contract_type": "Rental Agreement",
        "party_a_name": "Landlord",
        "party_b_name": "Tenant",
        "custom_clauses": "Rent is 5000 per month, No pets",
        "effective_date": "2025-01-01"
    })
    assert response.status_code == 200
    data = response.json()
    assert "Landlord" in data["contract_text"]
    assert "Tenant" in data["contract_text"]
    assert "5000" in data["contract_text"].replace(",", "")
