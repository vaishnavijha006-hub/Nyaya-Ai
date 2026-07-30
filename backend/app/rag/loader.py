"""
loader.py — Multi-document legal statute and judgment loader.
Supports Constitution of India, BNS, BNSS, BSA, RTI Act, Consumer Protection Act, IT Act, Motor Vehicles Act, and Supreme Court Judgments.
Features multi-engine fallback: pdfplumber -> pypdfium2 -> PyPDFLoader.
"""

import re
from pathlib import Path
from typing import List, Dict, Any

import pdfplumber
import pypdfium2
from langchain_core.documents import Document
from app.rag.parser import parse_legal_references

HEADER_HEIGHT = 45
FOOTER_HEIGHT = 45


def load_pdf(path: str, act_name: str = "") -> List[Document]:
    """
    Generic PDF loader for Indian Statutes & Supreme Court Judgments with multi-engine fallback.
    """
    resolved = Path(path).resolve()
    if not resolved.exists():
        raise FileNotFoundError(f"PDF document not found: {resolved}")

    filename = resolved.name
    canonical_act_name = act_name or resolved.stem.replace('_', ' ').title()
    documents = []

    # Engine 1: pdfplumber
    try:
        with pdfplumber.open(str(resolved)) as pdf:
            total = len(pdf.pages)
            print(f"[loader] Loading '{filename}' ({total} pages with pdfplumber)...")

            for page_num, page in enumerate(pdf.pages):
                try:
                    x0, top, x1, bottom = page.bbox
                    content_top = top + HEADER_HEIGHT
                    content_bottom = bottom - FOOTER_HEIGHT
                    cropped = page.crop((x0, content_top, x1, content_bottom))
                    text = cropped.extract_text(x_tolerance=3, y_tolerance=3) or ""
                except Exception:
                    text = page.extract_text(x_tolerance=3, y_tolerance=3) or ""

                if not text.strip():
                    continue

                refs = parse_legal_references(text)
                art_val = refs["article"]
                sec_val = refs["section"]

                documents.append(
                    Document(
                        page_content=text.strip(),
                        metadata={
                            "source": filename,
                            "title": canonical_act_name,
                            "act_name": canonical_act_name,
                            "page": page_num + 1,
                            "article": art_val,
                            "section": sec_val,
                            "chapter": refs["chapter"],
                            "part": refs["part"],
                            "articles": art_val or "",
                            "sections": sec_val or "",
                        },
                    )
                )
    except Exception as pdf_err:
        print(f"[loader] pdfplumber error for '{filename}' ({pdf_err}). Trying pypdfium2...")

    # Engine 2: pypdfium2 (if pdfplumber extracted 0 pages or failed)
    if not documents:
        try:
            pdf_ium = pypdfium2.PdfDocument(str(resolved))
            print(f"[loader] Extracting '{filename}' ({len(pdf_ium)} pages with pypdfium2)...")
            for idx in range(len(pdf_ium)):
                page = pdf_ium[idx]
                text = page.get_textpage().get_text_range() or ""
                if not text.strip():
                    continue
                refs = parse_legal_references(text)
                art_val = refs["article"]
                sec_val = refs["section"]
                documents.append(
                    Document(
                        page_content=text.strip(),
                        metadata={
                            "source": filename,
                            "title": canonical_act_name,
                            "act_name": canonical_act_name,
                            "page": idx + 1,
                            "article": art_val,
                            "section": sec_val,
                            "chapter": refs["chapter"],
                            "part": refs["part"],
                            "articles": art_val or "",
                            "sections": sec_val or "",
                        },
                    )
                )
        except Exception as ium_err:
            print(f"[loader] pypdfium2 error for '{filename}' ({ium_err}).")

    # Engine 3: PyPDFLoader (langchain_community)
    if not documents:
        try:
            from langchain_community.document_loaders import PyPDFLoader
            print(f"[loader] Trying PyPDFLoader for '{filename}'...")
            pypdf_loader = PyPDFLoader(str(resolved))
            pypdf_docs = pypdf_loader.load()
            for idx, doc in enumerate(pypdf_docs):
                text = doc.page_content or ""
                if not text.strip():
                    continue
                refs = parse_legal_references(text)
                art_val = refs["article"]
                sec_val = refs["section"]
                documents.append(
                    Document(
                        page_content=text.strip(),
                        metadata={
                            "source": filename,
                            "title": canonical_act_name,
                            "act_name": canonical_act_name,
                            "page": idx + 1,
                            "article": art_val,
                            "section": sec_val,
                            "chapter": refs["chapter"],
                            "part": refs["part"],
                            "articles": art_val or "",
                            "sections": sec_val or "",
                        },
                    )
                )
        except Exception as pypdf_err:
            print(f"[loader] PyPDFLoader error for '{filename}' ({pypdf_err}).")

    print(f"[loader] Loaded {len(documents)} pages from '{filename}'")
    return documents