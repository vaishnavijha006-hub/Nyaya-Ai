from app.rag.retriever import retrieve

queries = [
    "What is Section 173 of BNSS?",
    "Explain Section 193 of BNSS.",
    "BNSS arrest procedure"
]

for q in queries:
    print("=" * 60)
    print(f"QUERY: {q}")
    print("=" * 60)
    docs = retrieve(q, k=3)
    for idx, doc in enumerate(docs):
        print(f"Rank {idx+1}:")
        print(f"  act_name: {doc.metadata.get('act_name')}")
        print(f"  section: {doc.metadata.get('section')}")
        print(f"  page: {doc.metadata.get('page')}")
        print(f"  chunk_id: {doc.metadata.get('chunk_id')}")
        print(f"  confidence: {doc.metadata.get('confidence')}")
        print(f"  snippet: {repr(doc.page_content[:150])}\n")
