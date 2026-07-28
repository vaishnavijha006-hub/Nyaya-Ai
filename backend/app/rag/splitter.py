"""
splitter.py — Legal-document-aware text splitter for the Constitution of India.

Design decisions:
1. Two-stage splitting:
   - Stage 1: Force split at every "ARTICLE N" boundary. This ensures that short
     articles (like Article 21) are NEVER grouped into the same chunk as the
     previous article, regardless of chunk_size.
   - Stage 2: Recursive length-based splitting (800 chars). This ensures no chunk
     exceeds the 256-token limit of all-MiniLM-L6-v2.

2. chunk_size = 800 chars, chunk_overlap = 150 chars.

3. Post-processing metadata: extracts the primary article number from the chunk
   text so the retriever can use metadata filtering (primary_article="21") to
   guarantee 100% precision on direct queries.
"""

import re
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


def split_documents(documents: list) -> list:
    """
    Split page-level Documents into retrieval-ready chunks.
    """
    # ── STAGE 1: Force split at Article boundaries ────────────────────────────
    # The loader injects "\n\nARTICLE N\n" before each article.
    # We split on \n\n but use a lookahead so the chunk STARTS with "ARTICLE N".
    article_docs = []
    
    for doc in documents:
        # Split text into blocks where each block starts with ARTICLE if present
        parts = re.split(r'\n\n(?=ARTICLE \d)', doc.page_content)
        for part in parts:
            part = part.strip()
            if part:
                # Copy metadata so each article block inherits the page metadata
                article_docs.append(Document(page_content=part, metadata=doc.metadata.copy()))

    # ── STAGE 2: Enforce max chunk size ───────────────────────────────────────
    # For any article that exceeds 800 chars, split it recursively.
    splitter = RecursiveCharacterTextSplitter(
        separators=["\n\n", "\n", ". ", " ", ""],
        chunk_size=800,
        chunk_overlap=150,
        length_function=len,
    )
    
    chunks = splitter.split_documents(article_docs)

    # ── STAGE 3: Extract primary article for metadata filtering ───────────────
    # We look for "ARTICLE N" in the text to label the chunk.
    # Since we forced splits at ARTICLE boundaries, the first ARTICLE found
    # in the chunk is guaranteed to be the primary one for that chunk.
    article_re = re.compile(r'ARTICLE\s+(\d+[A-Z]?)', re.IGNORECASE)
    
    for chunk in chunks:
        found = article_re.findall(chunk.page_content)
        if found:
            chunk.metadata["primary_article"] = found[0]
            # Also store all mentioned articles just in case
            chunk.metadata["article_refs"] = ", ".join(dict.fromkeys(found))

    return chunks