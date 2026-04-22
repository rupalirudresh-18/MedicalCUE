import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY is missing")

client = Groq(api_key=api_key)

def generate_answer(disease_name: str, disease_context: str, user_question: str) -> str:
    prompt = f"""
You are a helpful medical education assistant.

Use the provided disease context as your first source.
If the exact answer is not fully present in the context, you may give a  general educational answer based on standard medical knowledge.
Keep the answer simple, clear, and student-friendly.
Give answer in short way.
Do not claim diagnosis.
Do not prescribe medicines.

Disease: {disease_name}

Context:
{disease_context}

User question:
{user_question}
"""
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful medical assistant."},
            {"role": "user", "content": prompt}
        ],
        model="llama-3.3-70b-versatile"
    )

    return chat_completion.choices[0].message.content