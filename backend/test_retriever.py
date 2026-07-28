from app.rag.retriever import retrieve

docs = retrieve("What is Article 21?")

print("Retrieved:", len(docs))

print("\n")
print(docs[0].page_content)