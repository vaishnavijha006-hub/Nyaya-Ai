"""
splitter.py — Legal-document-aware text splitter for Indian Statutes & Judicial Documents.
Task 2 & 3: Uses robust parser.py to detect legal headings, populate standardized metadata fields,
and generate unique chunk IDs.
"""

import re
import uuid
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.rag.parser import parse_legal_references, is_legal_heading_start

# Splitter regex recognizing legal headings while avoiding ordinary lists: 1., (1), (a), (i)
_SPLIT_PATTERN = re.compile(
    r'\n\n(?=(?:ARTICLE|Article|Art\.|Arts\.|SECTION|Section|Sec\.|Secs\.|PART|Part|CHAPTER|Chapter|SCHEDULE|Schedule)\s+)'
)

def split_documents(documents: list, default_act_name: str = "Constitution of India") -> list:
    """
    Split page-level Documents into retrieval-ready chunks with rich, standardized legal metadata.
    """
    article_docs = []
    
    # ── STAGE 1: Split at genuine legal heading boundaries ─────────────────────
    for doc in documents:
        parts = _SPLIT_PATTERN.split(doc.page_content)
        for part in parts:
            part = part.strip()
            if part:
                meta = doc.metadata.copy()
                meta.setdefault("act_name", default_act_name)
                meta.setdefault("source", doc.metadata.get("source", default_act_name))
                meta.setdefault("title", doc.metadata.get("title", default_act_name))
                
                # Parse structured references from part
                refs = parse_legal_references(part)
                if refs["article"]:
                    meta["article"] = refs["article"]
                    meta["primary_article"] = refs["article"]
                if refs["section"]:
                    meta["section"] = refs["section"]
                if refs["chapter"]:
                    meta["chapter"] = refs["chapter"]
                if refs["part"]:
                    meta["part"] = refs["part"]
                    
                article_docs.append(Document(page_content=part, metadata=meta))

    # ── STAGE 2: Recursive length-based chunking ──────────────────────────────
    splitter = RecursiveCharacterTextSplitter(
        separators=["\n\n", "\n", ". ", " ", ""],
        chunk_size=750,
        chunk_overlap=150,
        length_function=len,
    )
    
    chunks = splitter.split_documents(article_docs)

    # ── STAGE 3: Metadata Enrichment & Standardized Key Enforcement ───────────
    for idx, chunk in enumerate(chunks):
        refs = parse_legal_references(chunk.page_content)
        
        # Ensure all 12 standardized metadata fields exist (storing None if missing)
        chunk.metadata["source"] = chunk.metadata.get("source") or default_act_name
        chunk.metadata["title"] = chunk.metadata.get("title") or default_act_name
        chunk.metadata["act_name"] = chunk.metadata.get("act_name") or default_act_name
        chunk.metadata["page"] = chunk.metadata.get("page")
        chunk.metadata["article"] = chunk.metadata.get("article") or refs["article"] or chunk.metadata.get("primary_article")
        chunk.metadata["primary_article"] = chunk.metadata["article"]
        chunk.metadata["section"] = chunk.metadata.get("section") or refs["section"]
        chunk.metadata["chapter"] = chunk.metadata.get("chapter") or refs["chapter"]
        chunk.metadata["part"] = chunk.metadata.get("part") or refs["part"]
        chunk.metadata["judgment_name"] = chunk.metadata.get("judgment_name")
        chunk.metadata["citation"] = chunk.metadata.get("citation")
        chunk.metadata["year"] = chunk.metadata.get("year")
        chunk.metadata["chunk_id"] = chunk.metadata.get("chunk_id") or f"chunk_{chunk.metadata.get('page', 0)}_{idx}_{uuid.uuid4().hex[:8]}"

    return chunks