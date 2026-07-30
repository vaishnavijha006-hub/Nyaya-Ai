"""
pdf_upload.py — Phase 10: Session-Based PDF Upload & Temporary RAG.

Endpoints:
    POST /pdf/upload   — Upload PDF, create session collection, return session_id
    GET  /pdf/sessions — List active sessions (for debugging / UI)
    DELETE /pdf/session/{session_id} — Manually expire a session

Architecture:
    PDF bytes → pdfplumber validation → PyPDFLoader extraction → split_documents
    → Chroma.from_documents(collection=session_<uuid>, dir=session-vector-db/<uuid>)
    → SessionMeta registered in session_store
    → session_id returned to client

The permanent Constitution collection is NEVER modified.
"""

import io
import logging
import shutil
import uuid
from pathlib import Path
from typing import Optional

import pdfplumber
from fastapi import APIRouter, UploadFile, File, HTTPException, Request, status
from fastapi.responses import JSONResponse
from langchain_chroma import Chroma
from langchain_core.documents import Document
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.rag.embedder import get_embeddings
from app.rag.splitter import split_documents
from app.rag.session_store import (
    SESSION_DB_ROOT,
    register_session,
    get_session,
    delete_session,
    list_active_sessions,
)
from app.utils.security import validate_file_upload

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/pdf", tags=["pdf-upload"])

# ── Limits ────────────────────────────────────────────────────────────────────
MAX_FILE_BYTES = 20 * 1024 * 1024   # 20 MB
MAX_PAGES = 500

# Temp directory for spooled uploads (deleted immediately after indexing)
_TMP_DIR = Path("tmp_uploads")
_TMP_DIR.mkdir(exist_ok=True)


# ── Response models ───────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    session_id: str
    filename: str
    pages: int
    chunks: int
    expires_in: str
    message: str


class SessionInfo(BaseModel):
    session_id: str
    filename: str
    pages: int
    chunks: int
    expires_in_seconds: int


# ── Validation helpers ────────────────────────────────────────────────────────

def _validate_pdf_bytes(contents: bytes, filename: str) -> None:
    """
    Validate PDF bytes using pdfplumber:
        1. Confirm it is a valid PDF (not corrupted).
        2. Reject encrypted PDFs (pdfplumber raises PDFPasswordIncorrect).
        3. Enforce MAX_PAGES limit.
    Raises HTTPException on failure.
    """
    try:
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            n_pages = len(pdf.pages)
    except Exception as e:
        err = str(e).lower()
        if "password" in err or "encrypt" in err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Encrypted PDFs are not supported. Please provide an unlocked PDF."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or unreadable PDF: {str(e)}"
        )

    if n_pages > MAX_PAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PDF too large: {n_pages} pages (maximum {MAX_PAGES} pages allowed)."
        )


# ── Upload endpoint ───────────────────────────────────────────────────────────

@router.post("/upload", response_model=UploadResponse)
@limiter.limit("5/minute")
async def upload_pdf(request: Request, file: UploadFile = File(...)):
    """
    Upload a legal PDF and create a temporary 30-minute session for RAG queries.

    Workflow:
        1. Validate file size, type, and content (pdfplumber)
        2. Extract pages with PyPDFLoader
        3. Chunk + embed into a session-scoped Chroma collection
        4. Register session in session_store
        5. Return session_id — use in /chat requests as session_id field

    The permanent Constitution collection is never modified.
    Rate limit: 5 uploads / minute per IP.
    """
    # ── Size + extension check ─────────────────────────────────────────────────
    contents = await file.read()
    validate_file_upload(
        file_filename=file.filename or "upload.pdf",
        file_size=len(contents),
        content_type=file.content_type or "",
    )
    if len(contents) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large ({len(contents) // 1024 // 1024} MB). Maximum is 20 MB."
        )
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted."
        )

    # ── PDF validation (pdfplumber) ────────────────────────────────────────────
    _validate_pdf_bytes(contents, file.filename or "upload.pdf")

    # ── Spill to temp file (PyPDFLoader requires a path) ──────────────────────
    tmp_id = str(uuid.uuid4())
    tmp_path = _TMP_DIR / f"{tmp_id}.pdf"
    try:
        tmp_path.write_bytes(contents)

        # ── Extract pages ──────────────────────────────────────────────────────
        from langchain_community.document_loaders import PyPDFLoader  # noqa: lazy import
        loader = PyPDFLoader(str(tmp_path))
        raw_docs = loader.load()

        if not raw_docs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF appears to be empty or contains no extractable text."
            )

        # ── Enrich metadata ────────────────────────────────────────────────────
        safe_name = Path(file.filename or "document.pdf").stem.replace("_", " ").replace("-", " ").title()
        for idx, doc in enumerate(raw_docs):
            doc.metadata["source"] = file.filename
            doc.metadata["act_name"] = safe_name
            doc.metadata["title"] = safe_name
            doc.metadata["document_type"] = "Uploaded PDF"
            doc.metadata["page"] = doc.metadata.get("page", idx + 1)

        # ── Chunk ──────────────────────────────────────────────────────────────
        chunks = split_documents(raw_docs, default_act_name=safe_name)
        n_pages = len(raw_docs)
        n_chunks = len(chunks)
        logger.info(f"[pdf_upload] '{file.filename}': {n_pages}p → {n_chunks} chunks")

        # ── Register session + create Chroma collection ────────────────────────
        # Session ID is generated BEFORE indexing so we can use it as collection name
        session_meta = register_session(
            filename=file.filename or "document.pdf",
            pages=n_pages,
            chunks=n_chunks,
        )
        db_path = session_meta.db_path
        db_path.mkdir(parents=True, exist_ok=True)

        # Add session_id to every chunk's metadata for provenance
        for chunk in chunks:
            chunk.metadata["session_id"] = session_meta.session_id

        # Create isolated Chroma collection (never touches nyaya_constitution)
        Chroma.from_documents(
            documents=chunks,
            embedding=get_embeddings(),
            persist_directory=str(db_path),
            collection_name=session_meta.collection_name,
        )
        logger.info(f"[pdf_upload] Session {session_meta.session_id} indexed at {db_path}")

        return UploadResponse(
            session_id=session_meta.session_id,
            filename=file.filename or "document.pdf",
            pages=n_pages,
            chunks=n_chunks,
            expires_in="30 minutes",
            message=f"PDF indexed successfully. Use session_id '{session_meta.session_id}' in /chat requests.",
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[pdf_upload] Processing failed: {exc}", exc_info=True)
        # Clean up partial session DB if created
        if 'session_meta' in dir() and session_meta.db_path.exists():  # type: ignore
            shutil.rmtree(session_meta.db_path, ignore_errors=True)  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF processing failed: {str(exc)}"
        )
    finally:
        # Always remove temp file
        tmp_path.unlink(missing_ok=True)


# ── Session management endpoints ──────────────────────────────────────────────

@router.get("/sessions", response_model=list[SessionInfo])
async def list_sessions():
    """List all active (non-expired) upload sessions. For debugging and UI status."""
    sessions = list_active_sessions()
    return [
        SessionInfo(
            session_id=m.session_id,
            filename=m.filename,
            pages=m.pages,
            chunks=m.chunks,
            expires_in_seconds=m.expires_in_seconds,
        )
        for m in sessions
    ]


@router.delete("/session/{session_id}")
async def expire_session(session_id: str):
    """Manually expire and delete a session before the 30-minute TTL."""
    found = delete_session(session_id)
    if not found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found or already expired."
        )
    return {"status": "deleted", "session_id": session_id}


@router.get("/session/{session_id}/status")
async def session_status(session_id: str):
    """Check if a session is still active and how long it has left."""
    meta = get_session(session_id)
    if meta is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found or expired."
        )
    return {
        "session_id": meta.session_id,
        "filename": meta.filename,
        "pages": meta.pages,
        "chunks": meta.chunks,
        "expires_in_seconds": meta.expires_in_seconds,
        "active": True,
    }
