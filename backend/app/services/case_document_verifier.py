import io
import json
import logging
import re
from typing import Optional, Dict, Any, List

import pdfplumber
from app.services.llm import get_groq_client, PRIMARY_MODEL, _is_rate_limit_error, _gemini_fallback

logger = logging.getLogger(__name__)

VERIFICATION_SYSTEM_PROMPT = """You are an expert Indian Legal AI Document Verifier.
Your job is to thoroughly inspect an extracted legal case document (such as an FIR, Lease Agreement, Cheque Dishonour Memo, Legal Demand Notice, Contract, or Court Order) and verify it against:
1. Reported user case details (if provided).
2. Statutory requirements under Indian Law (e.g. Negotiable Instruments Act 1881, Bharatiya Nyaya Sanhita, Bharatiya Nagarik Suraksha Sanhita, Transfer of Property Act 1882, Consumer Protection Act 2019).

You MUST return strictly valid JSON matching this schema:
{
  "document_type": "CHEQUE_RETURN_MEMO | LEASE_AGREEMENT | LEGAL_NOTICE | FIR_COPY | CONTRACT | UNKNOWN",
  "verification_status": "VERIFIED_VALID | DISCREPANCY_DETECTED | LEGAL_DEFECT_FOUND",
  "confidence_score": 0.95,
  "extracted_metadata": {
    "parties": ["Name 1", "Name 2"],
    "document_date": "YYYY-MM-DD or text",
    "monetary_amount": "Amount in INR or null",
    "key_clauses_or_details": ["Key point 1", "Key point 2"]
  },
  "fact_checks": [
    {
      "parameter": "Parameter name (e.g., Amount, Date, Party Name)",
      "document_value": "Value found in doc",
      "reported_value": "Value reported in case or N/A",
      "matches": true,
      "note": "Explanation"
    }
  ],
  "statutory_checks": [
    {
      "rule": "Statutory rule name (e.g., Section 138 Notice 30-day Window)",
      "status": "PASSED | FAILED | WARNING",
      "finding": "Details on compliance or non-compliance"
    }
  ],
  "discrepancies": [
    "List of specific discrepancies, defects, or red flags found"
  ],
  "summary": "Clear 2-3 sentence executive summary of document verification results.",
  "recommendations": [
    "Actionable step 1 for user or lawyer"
  ]
}

Rules:
1. Be objective, precise, and legally sound.
2. If document details conflict with reported case info (e.g., cheque amount mismatch, date discrepancy), set verification_status to DISCREPANCY_DETECTED.
3. If statutory elements are defective (e.g., expired notice period, missing mandatory clause), set verification_status to LEGAL_DEFECT_FOUND.
4. Output ONLY valid JSON.
"""


def extract_document_text(file_bytes: bytes, filename: str) -> str:
    """
    Extract text from PDF or Image file.
    Tries pdfplumber first for PDFs, falls back to PyPDFLoader or Tesseract OCR.
    """
    ext = (filename.split(".")[-1] if "." in filename else "").lower()
    text = ""

    if ext == "pdf":
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                pages_text = [p.extract_text() or "" for p in pdf.pages]
                text = "\n\n".join(pages_text).strip()
        except Exception as e:
            logger.warning(f"pdfplumber extraction failed for {filename}: {e}")

        if not text:
            # Fallback to PyPDFLoader
            try:
                import tempfile
                from pathlib import Path
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                    tmp.write(file_bytes)
                    tmp_path = tmp.name
                
                from langchain_community.document_loaders import PyPDFLoader
                loader = PyPDFLoader(tmp_path)
                docs = loader.load()
                text = "\n\n".join([d.page_content for d in docs]).strip()
                Path(tmp_path).unlink(missing_ok=True)
            except Exception as e2:
                logger.error(f"PyPDFLoader fallback failed: {e2}")

    elif ext in ["png", "jpg", "jpeg", "tiff", "bmp"]:
        try:
            import pytesseract
            from PIL import Image
            img = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(img, lang="eng+hin").strip()
        except Exception as e:
            logger.error(f"Tesseract OCR failed for image {filename}: {e}")

    return text or "Unable to extract readable text from document."


def verify_case_document(extracted_text: str, filename: str, case_info: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Cross-checks extracted document text against case_info and Indian legal statutory rules using LLM.
    """
    client = get_groq_client()
    case_context = json.dumps(case_info or {})

    prompt = (
        f"FILENAME: {filename}\n\n"
        f"REPORTED CASE DETAILS:\n{case_context}\n\n"
        f"EXTRACTED DOCUMENT TEXT:\n{extracted_text[:6000]}\n\n"
        f"Verify the document and return strictly valid JSON matching the specified schema."
    )

    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": VERIFICATION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=2000,
        )
        content = response.choices[0].message.content
        return json.loads(content)

    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning("Groq rate limited in verify_case_document, falling back to Gemini")
            fallback_prompt = VERIFICATION_SYSTEM_PROMPT + "\n\nOUTPUT ONLY VALID JSON.\n\n" + prompt
            raw_text = _gemini_fallback(fallback_prompt, "")
            try:
                match = re.search(r'```(?:json)?\s*([\s\S]*?)```', raw_text)
                if match:
                    raw_text = match.group(1)
                return json.loads(raw_text.strip())
            except Exception as parse_err:
                logger.error(f"Failed to parse Gemini fallback JSON in document verifier: {parse_err}")
        else:
            logger.error(f"verify_case_document failed: {exc}")

    # Fallback response if LLM fails
    return {
        "document_type": "UNKNOWN",
        "verification_status": "DISCREPANCY_DETECTED",
        "confidence_score": 0.5,
        "extracted_metadata": {
            "parties": [],
            "document_date": None,
            "monetary_amount": None,
            "key_clauses_or_details": ["Document text extracted successfully but detailed AI analysis was limited."]
        },
        "fact_checks": [],
        "statutory_checks": [],
        "discrepancies": ["Automated AI analysis unavailable due to network timeout."],
        "summary": "Extracted document text successfully, but advanced verification analysis timed out.",
        "recommendations": ["Ensure document scan is clear and re-submit for verification."]
    }
