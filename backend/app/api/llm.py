import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def ask_llm(question: str) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Nyaya AI, an AI legal assistant. "
                    "Provide clear, concise legal information. "
                    "Do not claim to be a lawyer."
                ),
            },
            {
                "role": "user",
                "content": question,
            },
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content