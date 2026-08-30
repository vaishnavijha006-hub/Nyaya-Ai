"""
evidence.py — Data models for Step 5 Document and Evidence Engine.
"""
from typing import List, Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field


class DocumentStatus(str, Enum):
    RELEVANT = "RELEVANT"
    POTENTIALLY_RELEVANT = "POTENTIALLY_RELEVANT"
    IRRELEVANT = "IRRELEVANT"
    MISSING = "MISSING"
    INCONSISTENT = "INCONSISTENT"
    NEEDS_HUMAN_REVIEW = "NEEDS_HUMAN_REVIEW"


class CategoryDocumentRequirement(BaseModel):
    document_name: str
    why_it_matters: str
    is_mandatory: bool = True
    status: DocumentStatus = DocumentStatus.MISSING


class ExtractedDocumentComparison(BaseModel):
    filename: str
    document_type: str
    status: DocumentStatus
    extracted_text_snippet: Optional[str] = None
    extracted_date: Optional[str] = None
    extracted_amount: Optional[str] = None
    extracted_parties: List[str] = Field(default_factory=list)
    inconsistencies: List[str] = Field(default_factory=list)
    findings: List[str] = Field(default_factory=list)
    authenticity_disclaimer: str = Field(
        default="Note: AI system only checks document relevance and fact consistency. The system does NOT verify legal authenticity or origin of documents."
    )


class CaseEvidenceReport(BaseModel):
    case_category: str
    required_checklist: List[CategoryDocumentRequirement] = Field(default_factory=list)
    uploaded_documents: List[ExtractedDocumentComparison] = Field(default_factory=list)
    missing_evidence: List[str] = Field(default_factory=list)
    inconsistencies_detected: List[str] = Field(default_factory=list)
    authenticity_disclaimer: str = Field(
        default="Note: AI system only checks document relevance and fact consistency. The system does NOT verify legal authenticity or origin of documents."
    )
