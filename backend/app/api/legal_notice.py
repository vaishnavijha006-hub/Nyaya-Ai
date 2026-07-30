"""
Legal Notice Generator — FastAPI router.

POST /legal-notice/generate
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services.llm import get_groq_client
from app.utils.security import sanitize_input, check_prompt_injection

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/legal-notice", tags=["legal-notice"])


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

LANGUAGE_NAME_MAP: dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "ta": "Tamil",
    "te": "Telugu",
    "bn": "Bengali",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "ur": "Urdu",
    "hinglish": "Hinglish",
}

NOTICE_TYPES = [
    "Salary Recovery Notice",
    "Rent Notice",
    "Consumer Complaint Notice",
    "Property Dispute Notice",
    "Contract Breach Notice",
    "Money Recovery Notice",
    "Employment Notice",
    "Custom Legal Notice",
]

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class LegalNoticeRequest(BaseModel):
    notice_type: str = Field(..., min_length=1, description="Type of legal notice")
    sender_name: str = Field(..., min_length=1, description="Full name of the sender/complainant")
    sender_address: str = Field(default="", description="Postal address of the sender")
    recipient_name: str = Field(..., min_length=1, description="Full name of the recipient")
    recipient_address: str = Field(default="", description="Postal address of the recipient")
    subject: str = Field(default="", description="Subject of the legal notice")
    case_details: str = Field(..., min_length=1, description="Detailed facts of the case")
    legal_demand: str = Field(..., min_length=1, description="What the sender legally demands")
    deadline_days: int = Field(default=15, ge=1, le=180, description="Days given to comply")
    language: str = Field(default="en", description="ISO language code for the output")


class LegalNoticeResponse(BaseModel):
    notice: str
    language: str


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/generate", response_model=LegalNoticeResponse)
@limiter.limit("10/minute")
async def generate_legal_notice(request: Request, body: LegalNoticeRequest):
    """
    Draft a professional Legal Notice using Groq Llama 3.3.
    Supports multilingual output; names / addresses / dates are preserved in original form.
    """
    body.case_details = sanitize_input(body.case_details)
    body.legal_demand = sanitize_input(body.legal_demand)
    body.subject = sanitize_input(body.subject)

    check_prompt_injection(body.case_details)
    check_prompt_injection(body.legal_demand)

    logger.info(
        "Generating legal notice | type=%s sender=%s language=%s",
        body.notice_type,
        body.sender_name,
        body.language,
    )

    target_lang = LANGUAGE_NAME_MAP.get(body.language.lower(), "English")
    client = get_groq_client()


    # ------------------------------------------------------------------ #
    # System prompt                                                        #
    # ------------------------------------------------------------------ #
    system_prompt = (
        "You are Nyaya AI.\n"
        "You are an experienced Indian legal drafting assistant.\n"
        "Draft professional legal notices following Indian legal writing conventions.\n\n"
        "Requirements:\n"
        "- Formal, authoritative language\n"
        "- Proper legal structure and hierarchy\n"
        "- Never cite fake laws, fake section numbers, or fake court judgements\n"
        "- Never invent facts beyond what the user supplies\n"
        "- Leave fields blank (as appropriate placeholders) when information is missing\n"
        "- Support multilingual output\n"
        f"- Write the ENTIRE notice in: {target_lang}\n"
        "- CRITICAL: DO NOT translate proper names, addresses, contact numbers, email "
        "addresses, monetary amounts, or dates — preserve these verbatim in their original form\n\n"
        "Output format (follow exactly):\n"
        "LEGAL NOTICE\n\n"
        "Date: [Date]\n\n"
        "From:\n[Sender name & address]\n\n"
        "To:\n[Recipient name & address]\n\n"
        "Subject: [Subject]\n\n"
        "Respected Sir/Madam,\n\n"
        "[Opening paragraph stating purpose]\n\n"
        "FACTS OF THE CASE:\n"
        "[Numbered list of facts]\n\n"
        "LEGAL DEMAND:\n"
        "[Specific demand(s)]\n\n"
        "TIME LIMIT:\n"
        "[Deadline clause]\n\n"
        "FAILURE TO COMPLY:\n"
        "[Consequences clause]\n\n"
        "Yours faithfully,\n\n"
        "[Sender name]\n"
        "Signature: ________________\n"
        "Date: ________________"
    )

    # ------------------------------------------------------------------ #
    # User message                                                         #
    # ------------------------------------------------------------------ #
    user_content = (
        f"Notice Type: {body.notice_type}\n"
        f"Sender Name: {body.sender_name}\n"
        f"Sender Address: {body.sender_address or '[Not provided]'}\n"
        f"Recipient Name: {body.recipient_name}\n"
        f"Recipient Address: {body.recipient_address or '[Not provided]'}\n"
        f"Subject: {body.subject or f'{body.notice_type} — Legal Notice'}\n\n"
        f"Case Details / Facts:\n{body.case_details}\n\n"
        f"Legal Demand:\n{body.legal_demand}\n\n"
        f"Compliance Deadline: {body.deadline_days} days from the date of receipt of this notice.\n\n"
        "Draft the complete legal notice following the format specified in the system prompt. "
        "Be precise, formal, and do not add information beyond what is supplied above."
    )

    # ------------------------------------------------------------------ #
    # Groq call                                                            #
    # ------------------------------------------------------------------ #
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_content},
            ],
            temperature=0.15,
            max_tokens=2000,
        )
        notice_text = response.choices[0].message.content
        logger.info("Legal notice generated successfully for %s", request.sender_name)
        return LegalNoticeResponse(notice=notice_text, language=target_lang)

    except Exception as exc:
        logger.error("Failed to generate legal notice: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"LLM generation failed: {str(exc)}",
        )
