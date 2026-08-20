import logging
import traceback
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services.llm import get_groq_client
from app.utils.security import sanitize_input, check_prompt_injection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contract", tags=["contract"])
limiter = Limiter(key_func=get_remote_address)

class ContractRequest(BaseModel):
    contract_type: str = Field(..., description="Type of contract (e.g., NDA, Lease Agreement)")
    party_a_name: str = Field(..., description="Name of Party A (Disclosing Party/Lessor)")
    party_b_name: str = Field(..., description="Name of Party B (Receiving Party/Lessee)")
    jurisdiction: str = Field(default="India", description="State or country jurisdiction")
    effective_date: str = Field(..., description="Effective Date of the contract")
    custom_clauses: str = Field(default="", description="Any custom clauses or specific terms")

class ContractResponse(BaseModel):
    contract_text: str

@router.post("/generate", response_model=ContractResponse)
@limiter.limit("10/minute")
async def generate_contract(request: Request, body: ContractRequest):
    """
    Generate a complex legal contract using Groq LLM.
    """
    body.party_a_name = sanitize_input(body.party_a_name)
    body.party_b_name = sanitize_input(body.party_b_name)
    body.jurisdiction = sanitize_input(body.jurisdiction)
    body.custom_clauses = sanitize_input(body.custom_clauses)

    check_prompt_injection(body.custom_clauses)

    try:
        client = get_groq_client()
    except Exception as e:
        logger.error(f"[Contract Gen] Client init error: {e}")
        raise HTTPException(status_code=500, detail="LLM configuration error")

    system_prompt = (
        "You are an expert Indian Corporate Lawyer drafting a legally binding contract.\n"
        "Draft a formal, comprehensive contract based on the user's inputs.\n"
        "Format requirements:\n"
        "- Use standard legal numbering (1, 1.1, etc.).\n"
        "- Ensure boilerplate clauses (Severability, Governing Law, Entire Agreement) are included.\n"
        "- Leave blank signature lines for both parties at the end.\n"
        "- Do not include any conversational filler, output ONLY the contract text."
    )

    user_content = (
        f"Contract Type: {body.contract_type}\n"
        f"Party A: {body.party_a_name}\n"
        f"Party B: {body.party_b_name}\n"
        f"Jurisdiction: {body.jurisdiction}\n"
        f"Effective Date: {body.effective_date}\n"
        f"Additional Specific Terms:\n{body.custom_clauses if body.custom_clauses else 'Standard terms for this contract type.'}\n\n"
        "Please generate the complete legal agreement text."
    )

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.2,
            max_tokens=3000
        )
        contract_text = response.choices[0].message.content

        if not contract_text:
            raise HTTPException(status_code=500, detail="Generated empty response.")

        return ContractResponse(contract_text=contract_text)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[Contract Gen] Generation failed: {exc}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Contract generation failed: {str(exc)}"
        )
