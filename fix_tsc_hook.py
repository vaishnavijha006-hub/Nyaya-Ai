import re

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\hooks\use-streaming-chat.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix documentMemoryConflict if it doesn't exist
content = re.sub(r'documentMemoryConflict: null,\n?', '', content)

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\hooks\use-streaming-chat.ts', 'w', encoding='utf-8') as f:
    f.write(content)
