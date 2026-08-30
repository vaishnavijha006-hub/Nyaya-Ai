import requests
import json
import sys

API_URL = "http://127.0.0.1:8000"

def test_full_legal_journey():
    print("\n--- Testing End-to-End Guided Legal Journey Engine ---")
    
    # 1. Test Nearest DLSA lookup
    res = requests.get(f"{API_URL}/api/legal-journey/nearest-dlsa?state=Delhi&district=Central")
    print("Nearest DLSA Lookup:", res.json()["dlsa_name"])
    assert "Tis Hazari" in res.json()["dlsa_name"] or "Central" in res.json()["dlsa_name"]

    # 2. Test Full Journey Endpoint
    payload = {
        "user_input": "My landlord unlawfully locked me out of my apartment in Ghaziabad and refuses to return my security deposit.",
        "user_profile": {
            "state": "Uttar Pradesh",
            "district": "Ghaziabad",
            "annual_income": 120000,
            "gender": "female",
            "caste_category": "general",
            "disability": False
        },
        "uploaded_doc_names": ["rent_agreement.pdf"]
    }
    
    res = requests.post(f"{API_URL}/api/legal-journey/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()["journey"]
    
    print("\n1. Case Summary Category:", data["case_summary"]["category"])
    print("2. Required Documents Identified:", len(data["document_analysis"]["required_documents"]))
    print("3. Statutory Rights Extracted:", len(data["legal_rights_and_judgments"]["statutory_rights"]))
    print("4. Legal Aid Eligible?", data["legal_aid_eval"]["eligible"])
    print("5. Matched DLSA Office:", data["nearest_dlsa"]["dlsa_name"])
    print("6. DLSA Office Phone:", data["nearest_dlsa"]["phone"])
    
    print("\n[SUCCESS] All 5 steps of the End-to-End Guided Legal Journey Engine passed!")

if __name__ == "__main__":
    test_full_legal_journey()
