import re

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\backend\app\services\journey_state.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"follow_up_count": 0,', '"follow_up_count": 0,\n        "asked_questions": [],')

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\backend\app\services\journey_state.py', 'w', encoding='utf-8') as f:
    f.write(content)
