from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import logging
from app.services.llm import get_groq_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rti", tags=["rti"])

class RtiRequest(BaseModel):
    department: str
    public_authority: str
    information_required: str
    applicant_name: str
    address: str
    contact: str
    email: str
    language: str = "en"

class RtiResponse(BaseModel):
    application: str
    language: str

LANGUAGE_NAME_MAP = {
    'en': 'English',
    'hi': 'Hindi',
    'mr': 'Marathi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'bn': 'Bengali',
    'gu': 'Gujarati',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'pa': 'Punjabi',
    'ur': 'Urdu',
    'hinglish': 'Hinglish'
}

@router.post("/generate", response_model=RtiResponse)
async def generate_rti(request: RtiRequest):
    """
    FastAPI endpoint to draft a formal Right to Information (RTI) application using Groq.
    """
    logger.info(f"Generating RTI draft for {request.applicant_name} | language={request.language}")
    
    target_lang = LANGUAGE_NAME_MAP.get(request.language.lower(), "English")
    client = get_groq_client()

    system_prompt = (
        "You are an Indian Legal Assistant specialized in drafting RTI applications.\n"
        "Generate a formal RTI application under the Right to Information Act, 2005.\n\n"
        "Requirements:\n"
        "- Professional format\n"
        "- Government style\n"
        "- Polite language\n"
        "- No hallucinated facts\n"
        "- Only use information provided by the user.\n"
        "- Leave missing information blank instead of inventing details.\n"
        "- Support multiple languages.\n"
        f"- The entire application text, explanations, and surrounding requests must be written in: {target_lang}.\n"
        "- Critical exception: DO NOT translate addresses, applicant names, contact numbers, email addresses, or specific date fields. Preserve these details in their original script/form."
    )

    user_content = (
        f"Department: {request.department}\n"
        f"Public Authority: {request.public_authority}\n"
        f"Information Required:\n{request.information_required}\n"
        f"Applicant Name: {request.applicant_name}\n"
        f"Address: {request.address}\n"
        f"Contact: {request.contact}\n"
        f"Email: {request.email}\n\n"
        "Please draft a structured RTI application matching exactly the standard format:\n"
        "To,\n"
        "The Public Information Officer\n"
        "[Insert Authority and Department name here]\n\n"
        "Subject: Application under the Right to Information Act, 2005\n\n"
        "[Polite introductory request paragraph]\n\n"
        "Information Requested:\n"
        "[List numbered queries here based strictly on the Information Required field]\n\n"
        "Applicant Details:\n"
        "Name: [Name]\n"
        "Address: [Address]\n"
        "Contact: [Contact]\n"
        "Email: [Email]\n\n"
        "Date: [Current Date]\n"
        "Signature: ________________"
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.2,
            max_tokens=1500
        )
        application_text = response.choices[0].message.content
        return RtiResponse(application=application_text, language=target_lang)
    except Exception as exc:
        logger.error(f"Failed to generate RTI: {exc}")
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(exc)}")
