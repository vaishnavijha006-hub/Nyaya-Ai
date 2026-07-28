"""
embedder.py — Vector store creation with correct normalization and clean rebuild.

Changes from the broken original:
1. normalize_embeddings=True: CRITICAL for cosine similarity.
   Without normalization, Chroma computes dot-product on unnormalized vectors,
   producing incorrect similarity rankings.

2. reset=True + shutil.rmtree: wipes stale DB on every full re-ingest.
   Without this, old corrupted chunks (from the PyPDFLoader era) persist
   alongside new clean chunks and pollute retrieval results.

3. collection_name="nyaya_constitution": prevents cross-contamination with
   Chroma's default collection used by other projects.

4. Embedding model: "all-MiniLM-L6-v2" is kept but downgraded awareness:
   - 256 token input limit (enforced by chunk_size=800 in splitter)
   - Good baseline for English legal text
   See retriever.py for query-time improvements (MMR + reranking).
"""

import os
import shutil

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

# Relative path from backend/ directory
DB_PATH = "vector-db"
COLLECTION_NAME = "nyaya_constitution"

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"},
    encode_kwargs={
        # CRITICAL: normalize to unit vectors before storing.
        # Chroma's default distance metric is cosine similarity, which requires
        # normalized vectors. Without this, ranking is wrong.
        "normalize_embeddings": True
    },
)


def create_vector_db(chunks: list, reset: bool = True) -> Chroma:
    """
    Build the Chroma vector store from Document chunks.

    Args:
        chunks: list of LangChain Document objects from splitter.
        reset:  wipe the existing DB first (default: True).
                Always True when re-ingesting to avoid stale data.

    Returns:
        Chroma vector store instance.
    """
    if reset and os.path.exists(DB_PATH):
        shutil.rmtree(DB_PATH)
        print(f"[embedder] Cleared existing vector DB at '{DB_PATH}'")

    print(f"[embedder] Indexing {len(chunks)} chunks...")
    db = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=DB_PATH,
        collection_name=COLLECTION_NAME,
    )
    print(f"[embedder] Done. Collection '{COLLECTION_NAME}' ready at '{DB_PATH}'")
    return db