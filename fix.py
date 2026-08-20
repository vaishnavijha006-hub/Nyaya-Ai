import os

files = [
    "backend/app/api/admin.py",
    "backend/app/api/contract.py",
    "backend/app/api/fir.py",
    "backend/app/api/legal_notice.py",
    "backend/app/api/rti.py",
    "backend/app/services/llm.py"
]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('"gpt-oss-20b"', '"openai/gpt-oss-20b"')
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
