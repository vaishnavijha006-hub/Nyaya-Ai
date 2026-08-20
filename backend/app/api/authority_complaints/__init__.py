from fastapi import APIRouter

router = APIRouter()

@router.post("/")
def create_complaint():
    return {"message": "Complaint created"}

@router.get("/{complaint_id}")
def get_complaint(complaint_id: str):
    return {"id": complaint_id}
