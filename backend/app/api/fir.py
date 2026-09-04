import logging
import traceback
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services.llm import get_groq_client, PRIMARY_MODEL
from app.utils.security import sanitize_input, check_prompt_injection

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/fir", tags=["fir"])

LANGUAGE_NAME_MAP: dict[str, str] = {
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


class FirRequest(BaseModel):
    complainant_name: str = Field(..., min_length=1, description="Full name of complainant")
    date_of_incident: str = Field(..., min_length=1, description="Date and time of incident")
    location: str = Field(..., min_length=1, description="Location of incident")
    incident_description: str = Field(..., min_length=1, description="Detailed description of incident")
    suspect_details: str = Field(default="", description="Suspect details or unknown person info")
    police_station: str = Field(default="", description="Police station name or jurisdiction")
    contact: str = Field(default="", description="Contact details")
    language: str = Field(default="en", description="Output language code")


class FirResponse(BaseModel):
    fir_text: str
    language: str


@router.post("/generate", response_model=FirResponse)
@limiter.limit("10/minute")
async def generate_fir(request: Request, body: FirRequest):
    """
    FastAPI endpoint to draft a formal Police FIR Complaint letter under BNSS / BNS using Groq.
    """
    body.complainant_name = sanitize_input(body.complainant_name)
    body.location = sanitize_input(body.location)
    body.incident_description = sanitize_input(body.incident_description)
    body.suspect_details = sanitize_input(body.suspect_details)

    check_prompt_injection(body.incident_description)
    check_prompt_injection(body.suspect_details)

    logger.info(
        f"[FIR Generate] Request received | complainant={body.complainant_name!r} | "
        f"date={body.date_of_incident!r} | location={body.location!r} | language={body.language!r}"
    )

    target_lang = LANGUAGE_NAME_MAP.get(body.language.lower(), "English")

    client = get_groq_client()

    system_prompt = (
        "You are an expert Indian Police & Legal Assistant specializing in drafting formal FIR (First Information Report) complaint letters under the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) / CrPC and Bharatiya Nyaya Sanhita, 2023 (BNS) / IPC.\n\n"
        "Requirements:\n"
        "- Formal, precise, and authoritative legal complaint format addressed to the Officer-in-Charge / Station House Officer (SHO).\n"
        "- Clear structure with proper legal headers.\n"
        "- State relevant legal provisions / IPC / BNS sections where applicable based strictly on the facts described.\n"
        "- Never invent fictitious facts or names beyond what is provided.\n"
        "- Preserve proper names, addresses, dates, and contact details verbatim.\n"
        f"- Write the entire complaint document in {target_lang}."
    )

    user_content = (
        f"Complainant Name: {body.complainant_name}\n"
        f"Date of Incident: {body.date_of_incident}\n"
        f"Location of Incident: {body.location}\n"
        f"Police Station: {body.police_station or '[Nearest Police Station / SHO]'}\n"
        f"Contact / Address: {body.contact or '[Not Provided]'}\n"
        f"Suspect Details: {body.suspect_details or 'Unknown / Unidentified accused'}\n\n"
        f"Incident Description / Facts:\n{body.incident_description}\n\n"
        "Draft a formal FIR Complaint Letter with the standard layout:\n"
        "To,\n"
        "The Officer-in-Charge / Station House Officer (SHO),\n"
        "[Police Station Name & Location]\n\n"
        "Subject: Written Complaint for Registration of First Information Report (FIR) under Section 173 BNSS / Section 154 CrPC\n\n"
        "Respected Sir/Madam,\n\n"
        "[Opening paragraph stating identity and request for FIR registration]\n\n"
        "DETAILS OF INCIDENT & FACTS:\n"
        "[Chronological & detailed breakdown of facts based on the description]\n\n"
        "SUSPECT / ACCUSED DETAILS:\n"
        "[Details of suspect(s) or note on unknown accused]\n\n"
        "PRAYER / LEGAL DEMAND:\n"
        "[Request for immediate action, investigation, and FIR copy issuance]\n\n"
        "Complainant Details:\n"
        "Name: [Complainant Name]\n"
        "Date: [Current Date]\n"
        "Signature: ________________"
    )

    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.2,
            max_tokens=1800
        )
        fir_text = response.choices[0].message.content
        if not fir_text:
            raise HTTPException(status_code=500, detail="LLM returned an empty response.")
        return FirResponse(fir_text=fir_text, language=target_lang)
    except Exception as exc:
        logger.error(f"[FIR Generate] Failed: {exc}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"FIR Generation Failed: {str(exc)}")
