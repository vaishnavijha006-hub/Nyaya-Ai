"""
pipeline.py — Main RAG pipeline for Nyaya AI.

Data flow:
  question → retrieve() → context string → ask_llm_rag() → answer + sources

Key design decisions:
- Uses retrieve() (not get_retriever().invoke()) so the smart metadata filtering
  for Article-specific queries applies automatically.
- Context includes page number and article number from metadata — gives LLM
  the exact provenance of each chunk.
- Sources returned as serializable dicts (not raw Documents) so they work
  with FastAPI JSON responses.
- Debug output prints the primary_article metadata so you can verify instantly
  that Article 21 chunks are being retrieved for Article 21 queries.
"""

from app.rag.retriever import retrieve
from app.services.llm import ask_llm_rag


def ask_rag(question: str) -> dict:
    """
    Full RAG pipeline: retrieve → ground → generate → return.

    Returns:
        {
            "answer": str,
            "sources": [
                {
                    "page": int,
                    "source": str,
                    "primary_article": str,
                    "article_refs": str,
                    "content_preview": str (first 300 chars)
                },
                ...
            ]
        }
    """
    # ── Step 1: Retrieve with smart metadata filtering ────────────────────────
    docs = retrieve(question)

    # ── Step 2: Debug output ──────────────────────────────────────────────────
    print("\n" + "=" * 80)
    print(f"Query: {question}")
    print(f"Retrieved: {len(docs)} documents")
    print()
    for i, doc in enumerate(docs):
        src     = doc.metadata.get("source", "unknown")
        page    = doc.metadata.get("page", "?")
        art     = doc.metadata.get("primary_article", "—")
        refs    = doc.metadata.get("article_refs", "")
        print(f"----- Doc {i+1} | page={page} | primary_article={art} | refs={refs} -----")
        print(doc.page_content[:500])
        print()
    print("=" * 80 + "\n")

    # ── Step 3: Build grounded context string ─────────────────────────────────
    context_parts = []
    for doc in docs:
        page = doc.metadata.get("page", "?")
        art  = doc.metadata.get("primary_article", "")
        art_label = f"Article {art}" if art else f"Page {page}"
        context_parts.append(f"[{art_label} | Page {page}]\n{doc.page_content}")

    context = "\n\n---\n\n".join(context_parts)

    # ── Step 4: Generate answer ───────────────────────────────────────────────
    answer = ask_llm_rag(question=question, context=context)

    # ── Step 5: Build serializable source list ────────────────────────────────
    sources = [
        {
            "page":             doc.metadata.get("page"),
            "source":           doc.metadata.get("source"),
            "primary_article":  doc.metadata.get("primary_article", ""),
            "article_refs":     doc.metadata.get("article_refs", ""),
            "content_preview":  doc.page_content[:300],
        }
        for doc in docs
    ]

    return {"answer": answer, "sources": sources}