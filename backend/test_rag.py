"""
End-to-end RAG test.

Run from backend/ directory:
    python test_rag.py

Expected for "What is Article 21?":
- Retrieved chunks should contain "Article 21" or "right to life"
- Answer should describe the right to life and personal liberty
"""
from app.rag.pipeline import ask_rag

query = "What is Article 21?"
print(f"\nQuery: {query}\n")

result = ask_rag(query)

print("\n" + "=" * 60)
print("FINAL ANSWER")
print("=" * 60)
print(result["answer"])

print("\n" + "=" * 60)
print("SOURCES")
print("=" * 60)
for i, src in enumerate(result["sources"]):
    print(f"[{i+1}] Page {src['page']} | {src['source']}")
    print(f"     {src['content_preview']!r}")
    print()