from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Dict, Any, List, Optional
import json
from supabase import Client
from app.core.dependencies import get_supabase, get_current_user
from app.services.case_timeline import get_case_timeline
from app.services.case_summary import generate_case_summary
from app.services.case_document_verifier import extract_document_text, verify_case_document

router = APIRouter(prefix="/cases", tags=["cases"])

@router.get("/{case_id}/timeline")
async def fetch_case_timeline(
    case_id: str,
    supabase: Client = Depends(get_supabase),
    user_id: str = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    return await get_case_timeline(supabase, user_id, case_id)

@router.get("/{case_id}/summary")
async def fetch_case_summary(
    case_id: str,
    supabase: Client = Depends(get_supabase),
    user_id: str = Depends(get_current_user)
) -> Dict[str, Any]:
    return await generate_case_summary(supabase, user_id, case_id)

@router.post("/verify-document")
async def verify_document_endpoint(
    file: UploadFile = File(...),
    case_info_json: Optional[str] = Form(None)
) -> Dict[str, Any]:
    """
    Verify an uploaded case document against user reported case state and Indian legal statutory rules.
    """
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")
        
        extracted_text = extract_document_text(contents, file.filename or "document.pdf")
        if not extracted_text:
            extracted_text = f"Uploaded Document: {file.filename or 'document'}"

        case_info = None
        if case_info_json:
            try:
                case_info = json.loads(case_info_json)
            except Exception:
                pass

        verification_result = verify_case_document(
            extracted_text=extracted_text,
            filename=file.filename or "document.pdf",
            case_info=case_info
        )

        return {
            "success": True,
            "filename": file.filename,
            "extracted_text_snippet": extracted_text[:300],
            "verification": verification_result
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Document verification failed: {str(exc)}")

