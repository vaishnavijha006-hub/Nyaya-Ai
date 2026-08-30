import logging
import traceback
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, ValidationError
from app.services.llm import get_groq_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rti", tags=["rti"])

class RtiRequest(BaseModel):
    department: str = Field(..., min_length=1, description="Department name")
    public_authority: str = Field(..., min_length=1, description="Public authority name")
    information_required: str = Field(..., min_length=1, description="Details of information required")
    applicant_name: str = Field(..., min_length=1, description="Full name of applicant")
    address: str = Field(default="", description="Postal address")
    contact: str = Field(default="", description="Contact number")
    email: str = Field(default="", description="Email address")
    language: str = Field(default="en", description="Target response language code")

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

from fastapi import APIRouter, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.utils.security import sanitize_input, check_prompt_injection

limiter = Limiter(key_func=get_remote_address)

@router.post("/generate", response_model=RtiResponse)
@limiter.limit("10/minute")
async def generate_rti(request: Request, body: RtiRequest):
    """
    FastAPI endpoint to draft a formal Right to Information (RTI) application using Groq.
    Enforces 10 req/min rate limit and prompt injection protection.
    """
    # Sanitize and check prompt injection
    body.applicant_name = sanitize_input(body.applicant_name)
    body.public_authority = sanitize_input(body.public_authority)
    body.information_required = sanitize_input(body.information_required)
    
    check_prompt_injection(body.information_required)
    check_prompt_injection(body.public_authority)

    logger.info(
        f"[RTI Generate] Incoming request received | applicant={body.applicant_name!r} | "
        f"authority={body.public_authority!r} | department={body.department!r} | language={body.language!r}"
    )

    target_lang = LANGUAGE_NAME_MAP.get(body.language.lower(), "English")

    
    try:
        client = get_groq_client()
    except RuntimeError as rerr:
        logger.error(f"[RTI Generate] Configuration Error: {rerr}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server Configuration Error: {str(rerr)}"
        )
    except Exception as cerr:
        logger.error(f"[RTI Generate] Unexpected client initialization error: {cerr}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize AI service client: {str(cerr)}"
        )

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
        f"Department: {body.department}\n"
        f"Public Authority: {body.public_authority}\n"
        f"Information Required:\n{body.information_required}\n"
        f"Applicant Name: {body.applicant_name}\n"
        f"Address: {body.address}\n"
        f"Contact: {body.contact}\n"
        f"Email: {body.email}\n\n"
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

    logger.debug(f"[RTI Generate] System prompt sent to Groq:\n{system_prompt}")
    logger.debug(f"[RTI Generate] User prompt sent to Groq:\n{user_content}")

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.2,
            max_tokens=1500
        )
        application_text = response.choices[0].message.content
        if application_text:
            return RtiResponse(application=application_text, language=target_lang)
    except Exception as exc:
        logger.warning(f"[RTI Generate] Groq call failed, attempting fallback: {exc}")
import logging
import traceback
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, ValidationError
from app.services.llm import get_groq_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rti", tags=["rti"])

class RtiRequest(BaseModel):
    department: str = Field(..., min_length=1, description="Department name")
    public_authority: str = Field(..., min_length=1, description="Public authority name")
    information_required: str = Field(..., min_length=1, description="Details of information required")
    applicant_name: str = Field(..., min_length=1, description="Full name of applicant")
    address: str = Field(default="", description="Postal address")
    contact: str = Field(default="", description="Contact number")
    email: str = Field(default="", description="Email address")
    language: str = Field(default="en", description="Target response language code")

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

from fastapi import APIRouter, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.utils.security import sanitize_input, check_prompt_injection

limiter = Limiter(key_func=get_remote_address)

@router.post("/generate", response_model=RtiResponse)
@limiter.limit("10/minute")
async def generate_rti(request: Request, body: RtiRequest):
    """
    FastAPI endpoint to draft a formal Right to Information (RTI) application using Groq.
    Enforces 10 req/min rate limit and prompt injection protection.
    """
    # Sanitize and check prompt injection
    body.applicant_name = sanitize_input(body.applicant_name)
    body.public_authority = sanitize_input(body.public_authority)
    body.information_required = sanitize_input(body.information_required)
    
    check_prompt_injection(body.information_required)
    check_prompt_injection(body.public_authority)

    logger.info(
        f"[RTI Generate] Incoming request received | applicant={body.applicant_name!r} | "
        f"authority={body.public_authority!r} | department={body.department!r} | language={body.language!r}"
    )

    target_lang = LANGUAGE_NAME_MAP.get(body.language.lower(), "English")

    
    try:
        client = get_groq_client()
    except RuntimeError as rerr:
        logger.error(f"[RTI Generate] Configuration Error: {rerr}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server Configuration Error: {str(rerr)}"
        )
    except Exception as cerr:
        logger.error(f"[RTI Generate] Unexpected client initialization error: {cerr}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize AI service client: {str(cerr)}"
        )

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
        f"Department: {body.department}\n"
        f"Public Authority: {body.public_authority}\n"
        f"Information Required:\n{body.information_required}\n"
        f"Applicant Name: {body.applicant_name}\n"
        f"Address: {body.address}\n"
        f"Contact: {body.contact}\n"
        f"Email: {body.email}\n\n"
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

    logger.debug(f"[RTI Generate] System prompt sent to Groq:\n{system_prompt}")
    logger.debug(f"[RTI Generate] User prompt sent to Groq:\n{user_content}")

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.2,
            max_tokens=1500
        )
        application_text = response.choices[0].message.content
        if application_text:
            return RtiResponse(application=application_text, language=target_lang)
    except Exception as exc:
        logger.warning(f"[RTI Generate] Groq call failed, attempting fallback: {exc}")

    from app.services.llm import _gemini_fallback
    fallback_text = _gemini_fallback(system_prompt, user_content)
    if fallback_text and "Service temporarily busy" not in fallback_text:
        return RtiResponse(application=fallback_text, language=target_lang)

    # Deterministic RTI Application Template Fallback
    rti_template = (
        f"FORM 'A'\n"
        f"APPLICATION FOR INFORMATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005\n\n"
        f"To,\n"
        f"The Public Information Officer (PIO),\n"
        f"{getattr(body, 'public_authority', 'Public Authority')}\n\n"
        f"1. Full Name of Applicant: {getattr(body, 'applicant_name', 'Applicant')}\n"
        f"2. Address: {getattr(body, 'address', 'Address')}\n"
        f"3. Contact Details: {getattr(body, 'contact', 'Phone')} | {getattr(body, 'email', 'Email')}\n"
        f"4. Particulars of Information Sought:\n"
        f"   - Subject Matter: {getattr(body, 'information_required', 'Information Request')}\n"
        f"   - Department: {getattr(body, 'department', 'General')}\n\n"
        f"5. Application Fee Details: Payment of Rs. 10/- attached via IPO/Demand Draft/Online.\n"
        f"6. I state that the information sought does not fall within exemptions under Section 8 or 9 of the RTI Act 2005.\n\n"
        f"Place: [City]\n"
        f"Date: [Current Date]\n\n"
        f"Signature of Applicant: ________________"
    )
    return RtiResponse(application=rti_template, language=target_lang)
