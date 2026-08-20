from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID

from app.services.lawyer_workspace import LawyerWorkspaceService
# Assuming a get_db dependency exists
# from app.dependencies import get_db

router = APIRouter(prefix="/api/lawyers", tags=["lawyers"])

# Mock dependency for db
def get_db():
    return None

@router.post("/{lawyer_id}/cases/{case_id}/accept")
async def accept_case(lawyer_id: UUID, case_id: UUID, db=Depends(get_db)):
    service = LawyerWorkspaceService(db)
    try:
        success = await service.accept_case(lawyer_id, case_id)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.get("/{lawyer_id}/cases/{case_id}/notes")
async def get_notes(lawyer_id: UUID, case_id: UUID, db=Depends(get_db)):
    service = LawyerWorkspaceService(db)
    return await service.get_private_notes(lawyer_id, case_id)

@router.post("/{lawyer_id}/cases/{case_id}/notes")
async def add_note(lawyer_id: UUID, case_id: UUID, note: dict, db=Depends(get_db)):
    service = LawyerWorkspaceService(db)
    return await service.add_private_note(lawyer_id, case_id, note.get("note", ""))
