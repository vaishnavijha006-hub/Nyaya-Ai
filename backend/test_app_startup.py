from fastapi.testclient import TestClient
from app.main import app

def test_app_health_and_routes():
    client = TestClient(app)
    
    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}
    print("Health check endpoint passed!")

    # 2. Nearest DLSA endpoint
    res = client.get("/api/legal-journey/nearest-dlsa?state=Delhi&district=Central")
    assert res.status_code == 200
    assert "Tis Hazari" in res.json()["dlsa_name"] or "Central" in res.json()["dlsa_name"]
    print("DLSA lookup endpoint passed!")

    # 3. Required documents endpoint
    res = client.get("/api/legal-journey/required-documents?category=CHEQUE_BOUNCE")
    assert res.status_code == 200
    assert len(res.json()["required_documents"]) > 0
    print("Required documents endpoint passed!")

    # 4. Legal aid evaluation endpoint
    res = client.post("/legal-aid/evaluate", json={
        "income": 100000,
        "caste_category": "general",
        "gender": "female"
    })
    assert res.status_code == 200
    assert res.json()["eligible"] is True
    print("Legal aid evaluation endpoint passed!")

    print("\n[PASS] All FastAPI App Startup & Endpoint tests passed cleanly!")

if __name__ == "__main__":
    test_app_health_and_routes()
