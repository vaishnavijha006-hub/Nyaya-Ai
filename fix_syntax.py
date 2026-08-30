import re

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\backend\app\services\case_intake.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("f\"EXISTING CASE STATE (merge new info into this):\n{prev_state_str}\n\n\"", "f\"EXISTING CASE STATE (merge new info into this):\\n{prev_state_str}\\n\\n\"")
content = content.replace("f\"CONVERSATION HISTORY:\n{history or '(none)'}\n\n\"", "f\"CONVERSATION HISTORY:\\n{history or '(none)'}\\n\\n\"")
content = content.replace("f\"NEW USER INPUT:\n{user_input}\n\n\"", "f\"NEW USER INPUT:\\n{user_input}\\n\\n\"")

content = content.replace('CASE_INTAKE_SYSTEM_PROMPT + "\n\nOUTPUT ONLY VALID JSON.\n\n" + prompt', 'CASE_INTAKE_SYSTEM_PROMPT + "\\n\\nOUTPUT ONLY VALID JSON.\\n\\n" + prompt')

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\backend\app\services\case_intake.py', 'w', encoding='utf-8') as f:
    f.write(content)
