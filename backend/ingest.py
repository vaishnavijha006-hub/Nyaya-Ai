"""
ingest.py — One-shot ingestion script for the Nyaya AI knowledge base.

Run from the backend/ directory:
    python ingest.py

This script:
1. Loads the Constitution PDF using column-aware pdfplumber extraction
2. Splits into article-aligned chunks with metadata
3. Rebuilds the Chroma vector DB from scratch
4. Runs a verification query to confirm Article 21 retrieval works

Always run this after:
- Replacing the PDF
- Changing loader.py
- Changing splitter.py
- Changing embedder.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.rag.loader import load_pdf
from app.rag.splitter import split_documents
from app.rag.embedder import create_vector_db
from app.rag.retriever import retrieve

PDF_PATH = "knowledge-base/constitution_of_india.pdf"


def run_ingestion():
    print("=" * 60)
    print("Nyaya AI — Knowledge Base Ingestion")
    print("=" * 60)

    # ── Step 1: Load PDF ──────────────────────────────────────────────────────
    print("\n[1/4] Loading PDF with column-aware extraction...")
    docs = load_pdf(PDF_PATH)
    print(f"      Pages loaded: {len(docs)}")

    if not docs:
        print("ERROR: No pages loaded. Check the PDF path.")
        sys.exit(1)

    # Quick sanity check: find a page with Article 21
    article_21_pages = [d for d in docs if "21." in d.page_content or "Article 21" in d.page_content]
    if article_21_pages:
        page = article_21_pages[0]
        print(f"      Sample page {page.metadata['page']} preview:")
        print(f"      {repr(page.page_content[:300])}")
    else:
        print("      WARNING: Could not find Article 21 in any page!")

    # ── Step 2: Split into chunks ─────────────────────────────────────────────
    print("\n[2/4] Splitting into chunks...")
    chunks = split_documents(docs)
    print(f"      Total chunks: {len(chunks)}")

    # Verify Article 21 is in at least one chunk
    art21_chunks = [c for c in chunks if "Article 21" in c.page_content]
    art21_meta   = [c for c in chunks if c.metadata.get("primary_article") == "21"]

    print(f"      Chunks containing 'Article 21' text: {len(art21_chunks)}")
    print(f"      Chunks with primary_article='21' metadata: {len(art21_meta)}")

    if art21_chunks:
        print("      Article 21 chunk preview:")
        print(f"      {repr(art21_chunks[0].page_content[:400])}")
        print(f"      Metadata: {art21_chunks[0].metadata}")
    else:
        print("      CRITICAL: 'Article 21' not found in ANY chunk!")
        print("      The retrieval will FAIL. Check loader.py and splitter.py.")

    # ── Step 3: Create vector DB ──────────────────────────────────────────────
    print("\n[3/4] Creating vector DB (resetting old index)...")
    db = create_vector_db(chunks, reset=True)

    # ── Step 4: Verify retrieval ──────────────────────────────────────────────
    print("\n[4/4] Verifying retrieval for 'What is Article 21?'...")
    test_query = "What is Article 21?"
    
    # IMPORTANT: Use the actual retrieve function to test metadata filtering!
    results = retrieve(test_query, k=3)

    print(f"      Retrieved {len(results)} chunks:")
    for i, doc in enumerate(results):
        art = doc.metadata.get("primary_article", "?")
        page = doc.metadata.get("page", "?")
        print(f"      [{i+1}] primary_article={art} | page={page}")
        print(f"           {repr(doc.page_content[:200])}")

    has_art21 = any(
        "Article 21" in d.page_content or d.metadata.get("primary_article") == "21"
        for d in results
    )

    print()
    if has_art21:
        print("SUCCESS: Article 21 retrieved correctly!")
    else:
        print("FAILURE: Article 21 still not in top results.")
        print("Check loader.py column extraction and splitter.py article labeling.")

    print("\n" + "=" * 60)
    print("Ingestion complete.")
    print("=" * 60)


if __name__ == "__main__":
    run_ingestion()
