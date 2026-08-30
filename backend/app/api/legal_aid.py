from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class LegalAidRequest(BaseModel):
    income: float
    caste_category: str = "general" # 'sc', 'st', 'obc', 'general'
    gender: str = "male" # 'male', 'female', 'other'
    disability: bool = False
    senior_citizen: bool = False
    custody: bool = False
    victim_of_trafficking: bool = False
    industrial_workman: bool = False

class LegalAidResponse(BaseModel):
    eligible: bool
    message: str
    next_steps: str

@router.post("/legal-aid/evaluate", response_model=LegalAidResponse)
async def evaluate_legal_aid(request: LegalAidRequest):
    """
    Evaluates basic eligibility for government legal aid (DLSA) in India.
    Legal Services Authorities Act, 1987 Section 12 criteria.
    """
    is_eligible = False
    reasons = []

    if request.income < 300000:  # Threshold varies by state, using 3 Lakhs as average safe threshold
        is_eligible = True
        reasons.append("Income below threshold")
    if request.caste_category.lower() in ["sc", "st"]:
        is_eligible = True
        reasons.append("Member of Scheduled Caste or Scheduled Tribe")
    if request.gender.lower() in ["female", "other"]:
        is_eligible = True
        reasons.append("Women/Children are eligible")
    if request.disability:
        is_eligible = True
        reasons.append("Person with disability")
    if request.victim_of_trafficking:
        is_eligible = True
        reasons.append("Victim of trafficking or begar")
    if request.industrial_workman:
        is_eligible = True
        reasons.append("Industrial workman")
    if request.custody:
        is_eligible = True
        reasons.append("Person in custody/protective home")

    if is_eligible:
        return LegalAidResponse(
            eligible=True,
            message="Potentially eligible for legal aid. Please verify eligibility with the relevant DLSA.",
            next_steps=f"Your profile indicates eligibility under: {', '.join(reasons)}. Contact your District Legal Services Authority (DLSA) or visit nalsa.gov.in."
        )
    else:
        return LegalAidResponse(
            eligible=False,
            message="Based on the information provided, you may not meet the standard criteria for free government legal aid.",
            next_steps="We recommend consulting the Legal Saathi Lawyer Network for affordable legal assistance."
        )
