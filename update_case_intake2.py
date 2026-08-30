import re

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\backend\app\services\case_intake.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_followup_sys = '''FOLLOWUP_SYSTEM_PROMPT = """You are an empathetic Indian Legal AI intake assistant.
The user has described a legal problem. You need ONE specific follow-up question
to gather the most important missing information.

Rules:
- Ask exactly ONE clear, concise question.
- Adapt the question to the specific case type and facts already known.
- Be empathetic but professional.
- Do not number the question.
- Do not explain why you are asking.
- Output ONLY the question text, nothing else.
- DO NOT ask any question that is semantically similar to the PREVIOUSLY ASKED QUESTIONS.
"""'''
content = re.sub(r'FOLLOWUP_SYSTEM_PROMPT = """.*?Output ONLY the question text, nothing else\.\n"""', new_followup_sys, content, flags=re.DOTALL)

new_gen_func = '''def generate_smart_followup(missing_information: List[str], case_info: dict, language: str = "en", asked_questions: List[str] = None) -> str:
    """Generate a single targeted follow-up question based on what's missing."""
    if not missing_information:
        return "Could you share any additional details about your situation?"

    if asked_questions is None:
        asked_questions = []

    client = get_groq_client()
    category = case_info.get("category", "legal")
    facts_known = case_info.get("key_facts", [])
    prompt = (
        f"Case Type: {category}\\n"
        f"Sub-Category: {case_info.get('sub_category', 'unknown')}\\n"
        f"Facts already known: {', '.join(facts_known) if facts_known else 'none yet'}\\n"
        f"PREVIOUSLY ASKED QUESTIONS: {asked_questions}\\n"
        f"Most important missing piece: {missing_information[0]}\\n"
        f"All missing: {', '.join(missing_information[:3])}\\n\\n"
        f"Generate ONE empathetic follow-up question to ask the user for the missing information. DO NOT repeat any of the PREVIOUSLY ASKED QUESTIONS."
    )

    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": FOLLOWUP_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.5,
            max_tokens=120,
        )
        question_en = response.choices[0].message.content.strip()
    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning("Groq rate limited in generate_smart_followup, falling back to Gemini")
            question_en = _gemini_fallback(FOLLOWUP_SYSTEM_PROMPT, prompt).strip()
        else:
            logger.error(f"generate_smart_followup failed: {exc}")
            question_en = f"Could you provide more information about: {missing_information[0]}?"

    if language and language != "en":
        return translate_text(question_en, language)
    return question_en'''

content = re.sub(r'def generate_smart_followup.*?return question_en', new_gen_func, content, flags=re.DOTALL)

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\backend\app\services\case_intake.py', 'w', encoding='utf-8') as f:
    f.write(content)
