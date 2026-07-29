"""
ocr.py — OCR API Endpoint for Scanned Legal Documents & Images.

Pipeline:
Image / Scanned PDF
↓
pypdfium2 / pdf2image + pytesseract OCR (or fallbacks)
↓
Extracted Legal Text
↓
Chunking (splitter.py)
↓
Embedding (BAAI/bge-small-en-v1.5)
↓
ChromaDB Indexing for RAG
"""

import os
import uuid
import logging
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel

from app.rag.embedder import get_embeddings
from app.rag.splitter import split_documents
from langchain_core.documents import Document
from langchain_chroma import Chroma

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ocr", tags=["ocr"])

OCR_UPLOAD_DIR = Path("ocr_uploads")
OCR_UPLOAD_DIR.mkdir(exist_ok=True)


class OCRProcessResponse(BaseModel):
    doc_id: str
    filename: str
    extracted_text_snippet: str
    total_chunks: int
    message: str


def _get_ocr_vector_db() -> Chroma:
    return Chroma(
        persist_directory="user-vector-db",
        embedding_function=get_embeddings(),
        collection_name="user_pdf_documents",
    )


@router.post("/process", response_model=OCRProcessResponse)
async def process_scanned_document(file: UploadFile = File(...)):
    """
    Extract text from a scanned legal image or PDF via OCR, split into legal chunks,
    generate embeddings, and index into the RAG vector store.
    """
    allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: {allowed_extensions}"
        )

    doc_id = str(uuid.uuid4())
    file_path = OCR_UPLOAD_DIR / f"{doc_id}_{file.filename}"

    try:
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        extracted_text = ""

        # Perform text extraction with fallback handlers
        try:
            import pytesseract
            from PIL import Image

            if ext in {".png", ".jpg", ".jpeg", ".tiff", ".bmp"}:
                img = Image.open(file_path)
                extracted_text = pytesseract.image_to_string(img, lang="eng+hin")
            elif ext == ".pdf":
                import pypdfium2 as pdfium
                pdf = pdfium.PdfDocument(str(file_path))
                pages_text = []
                for page in pdf:
                    image = page.render(scale=2).to_pil()
                    txt = pytesseract.image_to_string(image, lang="eng+hin")
                    pages_text.append(txt)
                extracted_text = "\n\n".join(pages_text)
        except Exception as ocr_err:
            logger.warning(f"Native OCR engine unconfigured or failed ({ocr_err}) — attempting PyPDFLoader fallback")
            if ext == ".pdf":
                from langchain_community.document_loaders import PyPDFLoader
                loader = PyPDFLoader(str(file_path))
                docs = loader.load()
                extracted_text = "\n\n".join([d.page_content for d in docs])

        if not extracted_text.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not extract readable text from scanned document. Ensure document is clear."
            )

        # Wrap in Document object & chunk
        doc = Document(
            page_content=extracted_text,
            metadata={
                "doc_id": doc_id,
                "source": file.filename,
                "act_name": file.filename.replace(ext, "").replace("_", " ").title(),
                "is_ocr": True,
            }
        )

        chunks = split_documents([doc], default_act_name=doc.metadata["act_name"])
        db = _get_ocr_vector_db()
        db.add_documents(chunks)

        logger.info(f"OCR document processed successfully: {file.filename} ({len(chunks)} chunks indexed)")

        return OCRProcessResponse(
            doc_id=doc_id,
            filename=file.filename,
            extracted_text_snippet=extracted_text[:300],
            total_chunks=len(chunks),
            message="Scanned document processed via OCR and indexed for RAG search."
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"OCR processing failed: {exc}")
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR processing failed: {str(exc)}"
        )
