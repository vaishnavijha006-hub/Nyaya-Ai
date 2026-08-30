import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

def test_dlsa_eligible():
    response = client.post("/legal-aid/evaluate", json={
        "income": 10000,
        "caste_category": "sc",
        "gender": "female",
        "disability": False,
        "senior_citizen": False,
        "custody": False,
        "victim_of_trafficking": False,
        "industrial_workman": False
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["eligible"] is True
    assert "Potentially eligible for legal aid" in data["message"]
    assert "Income below threshold" in data["next_steps"]

def test_dlsa_ineligible():
    response = client.post("/legal-aid/evaluate", json={
        "income": 1000000,
        "caste_category": "general",
        "gender": "male",
        "disability": False,
        "senior_citizen": False,
        "custody": False,
        "victim_of_trafficking": False,
        "industrial_workman": False
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["eligible"] is False
    assert "may not meet the standard criteria" in data["message"]
    assert "Lawyer Network" in data["next_steps"]

def test_lawyer_network_mock():
    # Because db=None, mock should work
    lawyer_id = str(uuid.uuid4())
    case_id = str(uuid.uuid4())
    
    res = client.post(f"/api/lawyers/{lawyer_id}/cases/{case_id}/accept")
    assert res.status_code == 200
    assert res.json() == {"success": True}
    
    res = client.post(f"/api/lawyers/{lawyer_id}/cases/{case_id}/notes", json={"note": "Test note"})
    assert res.status_code == 200
    assert res.json()["note"] == "Test note"
    
    res = client.get(f"/api/lawyers/{lawyer_id}/cases/{case_id}/notes")
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["note"] == "Test note"
