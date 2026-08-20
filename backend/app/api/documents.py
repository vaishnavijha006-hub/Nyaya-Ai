from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import List

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    return {"filename": file.filename, "status": "uploaded to vault"}

@router.get("/")
async def list_documents():
    return {"documents": []}

@router.get("/{document_id}")
async def get_document(document_id: str):
    return {"document_id": document_id}
