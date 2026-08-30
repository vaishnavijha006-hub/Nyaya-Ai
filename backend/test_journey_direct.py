from app.services.legal_journey_engine import process_legal_journey
from app.services.dlsa_directory import get_nearest_dlsa

def test_direct():
    print("Testing process_legal_journey directly...")
    res = process_legal_journey(
        user_input="Landlord locked me out of my apartment in Ghaziabad",
        user_profile={
            "state": "Uttar Pradesh",
            "district": "Ghaziabad",
            "annual_income": 150000,
            "gender": "female",
            "caste_category": "general"
        },
        uploaded_doc_names=["Rent_Agreement.pdf"]
    )
    
    assert res["case_summary"]["category"] is not None
    assert len(res["document_analysis"]["required_documents"]) > 0
    assert len(res["legal_rights_and_judgments"]["statutory_rights"]) > 0
    assert res["legal_aid_eval"]["eligible"] is True
    assert res["nearest_dlsa"]["found"] is True
    assert "Ghaziabad" in res["nearest_dlsa"]["dlsa_name"]
    
    print("\nDirect test passed successfully!")
    print("Category:", res["case_summary"]["category"])
    print("DLSA Office:", res["nearest_dlsa"]["dlsa_name"])
    print("Address:", res["nearest_dlsa"]["address"])

if __name__ == "__main__":
    test_direct()
