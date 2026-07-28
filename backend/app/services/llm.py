import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── RAG system prompt ────────────────────────────────────────────────────────
# This is used exclusively when answering questions grounded in retrieved context.
# It must be strict about not hallucinating — critical for legal use cases.
_RAG_SYSTEM_PROMPT = (
    "You are Nyaya AI, an expert AI Legal Assistant specializing in the "
    "Constitution of India.\n\n"
    "STRICT RULES:\n"
    "1. Answer ONLY using information present in the provided context.\n"
    "2. If the answer is not found in the context, respond exactly with:\n"
    '   "I couldn\'t find this in the Constitution."\n'
    "3. Never fabricate legal information, citations, or Article numbers.\n"
    "4. Be concise and accurate. Cite the Article number when relevant.\n"
    "5. Do not claim to be a lawyer or provide personal legal advice."
)

# ── General system prompt ────────────────────────────────────────────────────
_GENERAL_SYSTEM_PROMPT = (
    "You are Nyaya AI, an AI legal assistant. "
    "Provide clear, concise legal information. "
    "Do not claim to be a lawyer."
)


def ask_llm(question: str) -> str:
    """
    General-purpose LLM call with no context grounding.
    Use for non-RAG queries (e.g., greetings, clarifications).
    """
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": _GENERAL_SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ],
        temperature=0.3,
    )
    return response.choices[0].message.content


def ask_llm_rag(question: str, context: str) -> str:
    """
    RAG-grounded LLM call.

    The system message sets strict context-only rules.
    The user message delivers both the retrieved context and the question.

    Why separate from ask_llm():
    - The system prompt is stricter (no fabrication allowed).
    - temperature=0.1 minimizes hallucinations for legal factual retrieval.
    - Context is injected properly into the user message, not mixed with
      role instructions (which caused conflicting LLM behavior previously).
    """
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": _RAG_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    "Context from the Constitution of India:\n\n"
                    f"{context}\n\n"
                    "---\n\n"
                    f"Question: {question}"
                ),
            },
        ],
        temperature=0.1,    # Low temp = more deterministic, less hallucination
        max_tokens=1024,
    )
    return response.choices[0].message.content