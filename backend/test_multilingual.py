import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.rag.pipeline import ask_rag

queries = [
    "\u092e\u0941\u091d\u0947 Article 21 \u0938\u092e\u091d\u093e\u0913",
    "mujhe kanoon ke bare me batao",
    "Explain fundamental rights",
]

for q in queries:
    print("=" * 60)
    result = ask_rag(q)
    lang    = result["detected_language"]
    answer  = result["answer"][:500]
    nsrc    = len(result["sources"])
    print("QUERY   :", q)
    print("LANGUAGE:", lang)
    print("ANSWER  :", answer)
    print("SOURCES :", nsrc, "chunks")
    print()
