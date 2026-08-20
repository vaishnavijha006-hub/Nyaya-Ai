from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.case_understanding import extract_case_info
from app.services.followup_questions import generate_followup_question

router = APIRouter()

class CaseUnderstandingRequest(BaseModel):
    user_input: str
    history: Optional[str] = ""
    current_state: Optional[Dict[str, Any]] = None
    language: Optional[str] = "en"

class CaseUnderstandingResponse(BaseModel):
    state: Dict[str, Any]
    followup_question: Optional[str] = None
    is_complete: bool

@router.post("/extract")
async def extract_case(request: CaseUnderstandingRequest):
    try:
        # Extract structured data
        new_state = extract_case_info(
            user_input=request.user_input, 
            history=request.history, 
            current_state=request.current_state
        )
        
        is_complete = new_state.get("classification_status") == "COMPLETE"
        followup_question = None
        
        if not is_complete and new_state.get("missing_information"):
            followup_question = generate_followup_question(
                missing_information=new_state.get("missing_information", []),
                current_state=new_state,
                language=request.language
            )
            
        return CaseUnderstandingResponse(
            state=new_state,
            followup_question=followup_question,
            is_complete=is_complete
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
