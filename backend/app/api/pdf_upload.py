"""
pdf_upload.py — User PDF Upload & Personal Vector Document Store Router.

Endpoints:
- POST /pdf/upload: Upload user PDF, chunk, embed, index into ChromaDB
- GET /pdf/list: List indexed custom user PDFs
- DELETE /pdf/{doc_id}: Delete custom uploaded document from vector DB
"""

import os
import shutil
import uuid
import logging
from typing import List, Optional
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Query
from pydantic import BaseModel
from langchain_community.document_loaders import PyPDFLoader
from langchain_chroma import Chroma

from app.rag.embedder import get_embeddings
from app.rag.splitter import split_documents

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pdf", tags=["pdf-upload"])

UPLOAD_DIR = Path("user_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

USER_VECTOR_DB_PATH = "user-vector-db"


class UploadResponse(BaseModel):
    doc_id: str
    filename: str
    total_pages: int
    total_chunks: int
    message: str


class DocumentMetadata(BaseModel):
    doc_id: str
    filename: str
    total_chunks: int


def _get_user_db() -> Chroma:
    return Chroma(
        persist_directory=USER_VECTOR_DB_PATH,
        embedding_function=get_embeddings(),
        collection_name="user_pdf_documents",
    )


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a user legal PDF document, split it, embed it with BAAI/bge-small-en-v1.5,
    and persist it to the user vector database for question answering.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF documents are allowed."
        )

    doc_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{doc_id}_{file.filename}"

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Saved uploaded PDF to {file_path}")

        # Load PDF using PyPDFLoader
        loader = PyPDFLoader(str(file_path))
        docs = loader.load()

        if not docs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded PDF appears to be empty or unreadable."
            )

        # Inject user document metadata
        for idx, doc in enumerate(docs):
            doc.metadata["doc_id"] = doc_id
            doc.metadata["source"] = file.filename
            doc.metadata["act_name"] = file.filename.replace(".pdf", "").replace("_", " ").title()
            doc.metadata["page"] = idx + 1

        # Chunk document
        chunks = split_documents(docs, default_act_name=doc.metadata["act_name"])

        # Index into user ChromaDB collection
        user_db = _get_user_db()
        user_db.add_documents(chunks)

        logger.info(f"Indexed {len(chunks)} chunks for document {doc_id} ({file.filename})")

        return UploadResponse(
            doc_id=doc_id,
            filename=file.filename,
            total_pages=len(docs),
            total_chunks=len(chunks),
            message="PDF uploaded and indexed successfully into legal vector store."
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to process PDF upload: {exc}")
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF indexing failed: {str(exc)}"
        )


@router.get("/list", response_model=List[DocumentMetadata])
async def list_documents():
    """
    List all uploaded user PDF documents currently stored in the vector database.
    """
    try:
        user_db = _get_user_db()
        data = user_db.get()
        metadatas = data.get("metadatas", [])
        
        doc_summary = {}
        for meta in metadatas:
            did = meta.get("doc_id")
            fname = meta.get("source", "Uploaded Document")
            if did:
                if did not in doc_summary:
                    doc_summary[did] = {"doc_id": did, "filename": fname, "total_chunks": 0}
                doc_summary[did]["total_chunks"] += 1

        return list(doc_summary.values())
    except Exception as exc:
        logger.error(f"Failed to list documents: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve uploaded documents: {str(exc)}"
        )


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    """
    Delete an uploaded PDF document and clear its chunks from the vector database.
    """
    try:
        user_db = _get_user_db()
        user_db.delete(where={"doc_id": doc_id})
        
        # Remove original file if it exists
        for p in UPLOAD_DIR.glob(f"{doc_id}_*"):
            p.unlink()

        logger.info(f"Deleted document {doc_id} from vector store and storage.")
        return {"status": "success", "message": f"Document {doc_id} deleted successfully."}
    except Exception as exc:
        logger.error(f"Failed to delete document {doc_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(exc)}"
        )
