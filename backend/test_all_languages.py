import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.rag.pipeline import ask_rag

queries = [
    ("English", "What are fundamental rights?"),
    ("Hindi", "मौलिक अधिकार क्या हैं?"),
    ("Marathi", "मूलभूत अधिकार काय आहेत? सांगा"),
    ("Tamil", "அடிப்படை உரிமைகள் என்றால் என்ன?"),
    ("Telugu", "ప్రాథమిక హక్కులు అంటే ఏమిటి?"),
    ("Bengali", "মৌলিক অধিকার কি?"),
    ("Gujarati", "મૂળભૂત અધિકારો શું છે?"),
    ("Kannada", "ಮೂಲಭೂತ ಹಕ್ಕುಗಳು ಯಾವುವು?"),
    ("Malayalam", "മൗലികാവകാശങ്ങൾ എന്തൊക്കെയാണ്?"),
    ("Punjabi", "ਮੌਲਿਕ ਅਧਿਕਾਰ ਕੀ ਹਨ?"),
    ("Urdu", "بنیادی حقوق کیا ہیں؟"),
    ("Hinglish", "fundamental rights kya hote hain batao"),
]

for lang_name, q in queries:
    print("=" * 60)
    try:
        result = ask_rag(q)
        detected_lang = result["detected_language"]
        answer = result["answer"][:300].replace('\n', ' ')
        print(f"EXPECTED : {lang_name}")
        print(f"QUERY    : {q}")
        print(f"DETECTED : {detected_lang}")
        print(f"ANSWER   : {answer}...")
    except Exception as e:
        print(f"EXPECTED : {lang_name}")
        print(f"FAILED   : {e}")
    print()
