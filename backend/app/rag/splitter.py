"""
splitter.py — Legal-document-aware text splitter for Indian Statutes & Judicial Documents.
"""

import re
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


def split_documents(documents: list, default_act_name: str = "Constitution of India") -> list:
    """
    Split page-level Documents into retrieval-ready chunks with rich legal metadata.
    """
    article_docs = []
    
    # ── STAGE 1: Force split at ARTICLE or SECTION boundaries ─────────────────
    for doc in documents:
        # Split on double newline followed by ARTICLE or SECTION keyword
        parts = re.split(r'\n\n(?=(?:ARTICLE|SECTION)\s+\d+)', doc.page_content)
        for part in parts:
            part = part.strip()
            if part:
                meta = doc.metadata.copy()
                meta.setdefault("act_name", default_act_name)
                meta.setdefault("source", doc.metadata.get("source", default_act_name))
                
                # Check for explicit ARTICLE tag
                art_match = re.search(r'ARTICLE\s+(\d+[A-Z]?)', part)
                if art_match:
                    meta["primary_article"] = art_match.group(1)
                    
                sec_match = re.search(r'SECTION\s+(\d+[A-Z]?)', part)
                if sec_match:
                    meta["section"] = sec_match.group(1)
                    
                article_docs.append(Document(page_content=part, metadata=meta))

    # ── STAGE 2: Recursive length-based chunking ──────────────────────────────
    splitter = RecursiveCharacterTextSplitter(
        separators=["\n\n", "\n", ". ", " ", ""],
        chunk_size=750,
        chunk_overlap=150,
        length_function=len,
    )
    
    chunks = splitter.split_documents(article_docs)

    # ── STAGE 3: Extract and label primary_article / section ─────────────────
    article_re = re.compile(r'ARTICLE\s+(\d+[A-Z]?)', re.IGNORECASE)
    section_re = re.compile(r'SECTION\s+(\d+[A-Z]?)', re.IGNORECASE)
    
    for chunk in chunks:
        found_articles = article_re.findall(chunk.page_content)
        if found_articles and "primary_article" not in chunk.metadata:
            chunk.metadata["primary_article"] = found_articles[0]
            chunk.metadata["article_refs"] = ", ".join(dict.fromkeys(found_articles))
            
        found_sections = section_re.findall(chunk.page_content)
        if found_sections and "section" not in chunk.metadata:
            chunk.metadata["section"] = found_sections[0]

    return chunks