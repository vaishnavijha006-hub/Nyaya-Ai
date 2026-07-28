from app.rag.loader import load_pdf

docs = load_pdf("knowledge-base/constitution_of_india.pdf")

print(f"Loaded {len(docs)} pages")
print(docs[0].page_content[:500])