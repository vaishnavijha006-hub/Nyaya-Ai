from app.rag.loader import load_pdf

docs = load_pdf("knowledge-base/constitution.pdf")

print("Pages:", len(docs))
print(docs[0].page_content[:500])