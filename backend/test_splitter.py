from app.rag.loader import load_pdf
from app.rag.splitter import split_documents

docs = load_pdf("knowledge-base/constitution_of_india.pdf")
chunks = split_documents(docs)

print(f"Original Pages: {len(docs)}")
print(f"Chunks: {len(chunks)}")
print("-" * 50)
print(chunks[0].page_content[:500])