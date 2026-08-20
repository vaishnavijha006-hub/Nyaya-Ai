from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.services.response_intelligence import analyze_authority_response
from app.services.deadline_engine import calculate_deadlines
from app.services.case_escalation import evaluate_escalation_need
from app.services.progress_engine import calculate_progress

router = APIRouter(prefix="/case_progress", tags=["case_progress"])

class ResponseIntelligenceRequest(BaseModel):
    case_details: dict
    response_text: str

class DeadlineRequest(BaseModel):
    case_type: str
    event_date: str

class EscalationRequest(BaseModel):
    case_details: dict
    current_level: int

class ProgressRequest(BaseModel):
    case_details: dict
    completed_steps: int
    total_steps: int

@router.post("/analyze_response")
async def api_analyze_response(request: ResponseIntelligenceRequest):
    return analyze_authority_response(request.case_details, request.response_text)

@router.post("/calculate_deadlines")
async def api_calculate_deadlines(request: DeadlineRequest):
    return calculate_deadlines(request.case_type, request.event_date)

@router.post("/evaluate_escalation")
async def api_evaluate_escalation(request: EscalationRequest):
    return evaluate_escalation_need(request.case_details, request.current_level)

@router.post("/calculate_progress")
async def api_calculate_progress(request: ProgressRequest):
    return {"progress": calculate_progress(request.case_details, request.completed_steps, request.total_steps)}
