import re

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\tests\utils\mail.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace e.message with (e as Error).message or similar
content = content.replace('e.message', '(e as Error).message')

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\tests\utils\mail.ts', 'w', encoding='utf-8') as f:
    f.write(content)
