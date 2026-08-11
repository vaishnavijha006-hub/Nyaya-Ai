import traceback
from app.rag.retriever import retrieve
try:
    retrieve("test")
except Exception as e:
    traceback.print_exc()
