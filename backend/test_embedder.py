"""
Rebuild script: loads the PDF, splits it into chunks, and rebuilds the vector DB.

Run from backend/ directory:
    python test_embedder.py

This script ALWAYS resets the vector DB (reset=True) to prevent stale embeddings.
After running this, run test_retriever.py to verify retrieval quality.
"""
from app.rag.loader import load_pdf
from app.rag.splitter import split_documents
from app.rag.embedder import create_vector_db

# Load PDF
print("[1/3] Loading PDF...")
docs = load_pdf("knowledge-base/constitution_of_india.pdf")
print(f"      Loaded {len(docs)} pages")
print(f"      First page preview: {docs[0].page_content[:200]!r}\n")

# Split into chunks
print("[2/3] Splitting into chunks...")
chunks = split_documents(docs)
print(f"      Created {len(chunks)} chunks")
print(f"      Sample chunk metadata: {chunks[0].metadata}")
print(f"      Sample chunk preview: {chunks[0].page_content[:300]!r}\n")

# Verify "Article 21" appears in at least one chunk
article_21_chunks = [c for c in chunks if "Article 21" in c.page_content]
print(f"      ✅ Chunks containing 'Article 21': {len(article_21_chunks)}")
if article_21_chunks:
    print(f"      → Preview: {article_21_chunks[0].page_content[:300]!r}\n")
else:
    print("      ❌ WARNING: 'Article 21' not found in any chunk! Check splitter.\n")

# Create vector DB (resets old DB)
print("[3/3] Creating vector DB (resetting old index)...")
db = create_vector_db(chunks, reset=True)
print("\n✅ Vector DB created successfully!")
print(f"   Total chunks indexed: {len(chunks)}")