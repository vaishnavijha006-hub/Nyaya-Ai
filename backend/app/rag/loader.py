"""
loader.py — Multi-document legal statute and judgment loader.
Supports Constitution of India, BNS, BNSS, BSA, RTI Act, Consumer Protection Act, IT Act, Motor Vehicles Act, and Supreme Court Judgments.
"""

import re
from pathlib import Path
from typing import List, Dict, Any

import pdfplumber
from langchain_core.documents import Document

HEADER_HEIGHT = 45
FOOTER_HEIGHT = 45

# Patterns for legal reference detection
_ARTICLE_RE = re.compile(r'\b(?:ARTICLE|Article)\s+(\d+[A-Z]?)\b')
_SECTION_RE = re.compile(r'\b(?:SECTION|Section|Sec\.)\s+(\d+[A-Z]?)\b')
_ACT_RE = re.compile(r'\b(?:Act|Sanhita|Adhiniyam|Code)\b', re.IGNORECASE)


def load_pdf(path: str, act_name: str = "") -> List[Document]:
    """
    Generic PDF loader for Indian Statutes & Supreme Court Judgments.
    Extracts text per page and injects standardized metadata:
    - source: filename
    - title: act_name or filename
    - page: page number
    - act_name: canonical act name
    """
    resolved = Path(path).resolve()
    if not resolved.exists():
        raise FileNotFoundError(f"PDF document not found: {resolved}")

    filename = resolved.name
    canonical_act_name = act_name or resolved.stem.replace('_', ' ').title()
    documents = []

    with pdfplumber.open(str(resolved)) as pdf:
        total = len(pdf.pages)
        print(f"[loader] Loading '{filename}' ({total} pages)...")

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

            # Detect mentioned articles/sections for page metadata
            articles = list(set(_ARTICLE_RE.findall(text)))
            sections = list(set(_SECTION_RE.findall(text)))

            documents.append(
                Document(
                    page_content=text.strip(),
                    metadata={
                        "source": filename,
                        "title": canonical_act_name,
                        "act_name": canonical_act_name,
                        "page": page_num + 1,
                        "articles": ", ".join(articles) if articles else "",
                        "sections": ", ".join(sections) if sections else "",
                    },
                )
            )

    print(f"[loader] Loaded {len(documents)} pages from '{filename}'")
    return documents