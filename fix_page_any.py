import re

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\app\auth\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'export default function AuthPage\(\{ searchParams \}: \{ searchParams: \{ defaultMode\?: "signin" \| "signup" \} \}\)', 'export default function AuthPage({ searchParams }: any)', content)

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\app\auth\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
