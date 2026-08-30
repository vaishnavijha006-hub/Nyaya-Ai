"""
action_plan.py — Data models for Step 16 Personalized Legal Action Plan.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RecommendationRationale(BaseModel):
    recommendation: str
    source_type: str = Field(..., description="USER_FACT | LEGAL_RAG | DETERMINISTIC_RULE | CASE_ANALYSIS")
    source_detail: str = Field(..., description="Exact fact, section, or rule providing justification")
    explanation: str = Field(..., description="Clear 'Why am I seeing this recommendation?' explanation")


class NyayaAIActionPlan(BaseModel):
    title: str = Field(default="YOUR NYAYA AI ACTION PLAN")
    
    # 16 Action Plan Sections
    your_issue: str = Field(..., description="1. Your issue")
    what_we_understood: Dict[str, Any] = Field(default_factory=dict, description="2. What we understood")
    important_facts: List[str] = Field(default_factory=list, description="3. Important facts")
    relevant_legal_information: List[str] = Field(default_factory=list, description="4. Relevant legal information")
    important_evidence: List[str] = Field(default_factory=list, description="5. Important evidence")
    missing_evidence: List[str] = Field(default_factory=list, description="6. Missing evidence")
    case_completeness: Dict[str, Any] = Field(default_factory=dict, description="7. Case completeness")
    settlement_possibility: str = Field(default="MEDIUM", description="8. Settlement possibility")
    adr_possibility: str = Field(default="Mediation", description="9. ADR possibility")
    legal_aid_eligibility: Dict[str, Any] = Field(default_factory=dict, description="10. Legal aid eligibility")
    lawyer_pathway: Dict[str, Any] = Field(default_factory=dict, description="11. Lawyer pathway")
    cluster_indication: Dict[str, Any] = Field(default_factory=dict, description="12. Cluster indication")
    pil_review_indication: Dict[str, Any] = Field(default_factory=dict, description="13. PIL review indication")
    documents_to_prepare: List[str] = Field(default_factory=list, description="14. Documents to prepare")
    recommended_next_steps: List[str] = Field(default_factory=list, description="15. Recommended next steps")
    important_warnings_disclaimer: Dict[str, Any] = Field(default_factory=dict, description="16. Important warnings/disclaimer")

    # Concise Structured Progression Flow
    what_happened: str = Field(default="", description="WHAT HAPPENED summary")
    what_may_apply: List[str] = Field(default_factory=list, description="WHAT MAY APPLY laws/provisions")
    what_you_have: List[str] = Field(default_factory=list, description="WHAT YOU HAVE evidence/facts")
    what_is_missing: List[str] = Field(default_factory=list, description="WHAT IS MISSING evidence/facts")
    what_you_can_consider_doing_next: List[str] = Field(default_factory=list, description="WHAT YOU CAN CONSIDER DOING NEXT actions")

    # Traceability & "Why am I seeing this recommendation?"
    recommendation_rationales: List[RecommendationRationale] = Field(
        default_factory=list,
        description="Traceability map for 'Why am I seeing this recommendation?'"
    )
    
    requires_human_review: bool = Field(default=True)
    ai_disclaimer: str = Field(
        default="This action plan is produced by Nyaya AI using deterministic rules, user-provided facts, and verified legal RAG sources. It provides legal information, NOT guaranteed legal outcomes."
    )
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
