"""
citations.py — Structured Citation Model and Builder for Nyaya AI.

Provides:
    CitationItem   — Pydantic model for a single source citation (Acts & Judgments).
    build_citation — Safely extract citation metadata from a retrieved Document.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel
from langchain_core.documents import Document


class CitationItem(BaseModel):
    """
    Structured citation extracted from a single retrieved legal document chunk.
    Supports both statutory Acts and landmark Judgments.
    """
    act_name: str
    document_type: str
    part: Optional[str] = None
    chapter: Optional[str] = None
    article: Optional[str] = None
    section: Optional[str] = None
    page: Optional[int] = None
    confidence: float
    chunk_id: str
    # Phase 11 Judgment specific fields
    case_name: Optional[str] = None
    court: Optional[str] = None
    citation: Optional[str] = None
    year: Optional[str] = None
    bench: Optional[str] = None
    holding: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "act_name": "Maneka Gandhi v. Union of India",
                "document_type": "Judgment",
                "case_name": "Maneka Gandhi v. Union of India",
                "court": "Supreme Court of India",
                "citation": "AIR 1978 SC 597",
                "year": "1978",
                "confidence": 0.98,
                "chunk_id": "chunk_10_abcd",
                "holding": "Expanded Article 21 right to personal liberty."
            }
        }


def build_citation(doc: Document) -> CitationItem:
    """
    Safely extract a CitationItem from a LangChain Document's metadata.
    """
    meta = doc.metadata if doc.metadata else {}

    # --- act_name / case_name ---
    act_name: str = str(meta.get("act_name") or meta.get("case_name") or meta.get("title") or "Legal Document")
    document_type: str = str(meta.get("document_type") or "Unknown")

    raw_article = meta.get("article") or meta.get("primary_article")
    article: Optional[str] = str(raw_article) if raw_article not in (None, "", "None") else None

    raw_section = meta.get("section")
    section: Optional[str] = str(raw_section) if raw_section not in (None, "", "None") else None

    raw_part = meta.get("part")
    part: Optional[str] = str(raw_part) if raw_part not in (None, "", "None") else None

    raw_chapter = meta.get("chapter")
    chapter: Optional[str] = str(raw_chapter) if raw_chapter not in (None, "", "None") else None

    raw_page = meta.get("page")
    try:
        page: Optional[int] = int(raw_page) if raw_page is not None else None
    except (ValueError, TypeError):
        page = None

    raw_conf = meta.get("confidence") or meta.get("fusion_score") or 0.0
    try:
        confidence: float = round(float(raw_conf), 4)
    except (ValueError, TypeError):
        confidence = 0.0

    raw_cid = meta.get("chunk_id") or meta.get("id")
    chunk_id: str = str(raw_cid) if raw_cid not in (None, "", "None") else "unknown"

    # Judgment optional metadata
    case_name = str(meta.get("case_name")) if meta.get("case_name") else None
    court = str(meta.get("court")) if meta.get("court") else None
    citation_str = str(meta.get("citation")) if meta.get("citation") else None
    year_str = str(meta.get("year")) if meta.get("year") else None
    bench_str = str(meta.get("bench")) if meta.get("bench") else None
    holding_str = str(meta.get("holding")) if meta.get("holding") else None

    return CitationItem(
        act_name=act_name,
        document_type=document_type,
        part=part,
        chapter=chapter,
        article=article,
        section=section,
        page=page,
        confidence=confidence,
        chunk_id=chunk_id,
        case_name=case_name,
        court=court,
        citation=citation_str,
        year=year_str,
        bench=bench_str,
        holding=holding_str,
    )


def build_citations(docs: list[Document]) -> list[CitationItem]:
    """Build list of CitationItems from retrieved Documents."""
    citations: list[CitationItem] = []
    for doc in docs:
        try:
            citations.append(build_citation(doc))
        except Exception:
            continue
    return citations


def build_readable_citation_block(citations: list[CitationItem]) -> str:
    """Build a compact, human-readable citation reference block for LLM prompt context."""
    if not citations:
        return ""
    lines = ["Retrieved Sources:"]
    for idx, c in enumerate(citations, start=1):
        if c.document_type == "Judgment" or c.case_name:
            lines.append(f"  [{idx}] ⚖️ {c.case_name or c.act_name} | {c.citation or 'Supreme Court'} | Year: {c.year or 'N/A'}")
            if c.holding:
                lines.append(f"       Holding: {c.holding}")
        else:
            ref_parts = [c.act_name]
            if c.part:
                ref_parts.append(f"Part {c.part}")
            if c.article:
                ref_parts.append(f"Article {c.article}")
            if c.section:
                ref_parts.append(f"Section {c.section}")
            if c.page:
                ref_parts.append(f"Page {c.page}")
            lines.append(f"  [{idx}] 📄 " + " — ".join(ref_parts))
    return "\n".join(lines)
