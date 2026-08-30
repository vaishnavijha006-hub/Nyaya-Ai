import pytest
from app.services.case_document_verifier import extract_document_text, verify_case_document

def test_verify_case_document_structure():
    sample_text = """
    CHEQUE RETURN MEMO
    Bank: State Bank of India
    Date: 2026-08-10
    Cheque No: 450122
    Amount: Rs 1,50,000/-
    Reason for Return: Funds Insufficient
    Drawer: Ramesh Kumar
    Payee: Suresh Sharma
    """
    
    case_info = {
        "category": "CHEQUE_BOUNCE",
        "cheque_amount": "150000",
        "drawer_name": "Ramesh Kumar",
        "dishonour_reason": "Funds Insufficient"
    }
    
    result = verify_case_document(sample_text, "return_memo.pdf", case_info)
    
    assert "verification_status" in result
    assert result["verification_status"] in ["VERIFIED_VALID", "DISCREPANCY_DETECTED", "LEGAL_DEFECT_FOUND"]
    assert "extracted_metadata" in result
    assert "summary" in result
    print("Verification result test passed successfully:", result["verification_status"])

if __name__ == "__main__":
    test_verify_case_document_structure()
