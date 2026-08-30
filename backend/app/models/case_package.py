"""
case_package.py — Data models for Step 9 Judge-Ready Case Package.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class IssueEvidenceItem(BaseModel):
    issue: str
    supporting_facts: List[str] = Field(default_factory=list)
    supporting_documents: List[str] = Field(default_factory=list)
    evidence_status: str = Field(default="CLAIMED")  # VERIFIED | CLAIMED | MISSING


class ChronologyItem(BaseModel):
    date_time: str
    event_description: str
    source: str = "User Statement"


class AnnexureItem(BaseModel):
    annexure_number: str
    document_name: str
    status: str = "UPLOADED"  # UPLOADED | REQUESTED | MISSING


class StructuredCasePackage(BaseModel):
    package_title: str = Field(default="Judge-Ready Structured Case Package")
    case_summary: Dict[str, Any] = Field(default_factory=dict)
    parties: Dict[str, Any] = Field(default_factory=dict)
    chronology: List[ChronologyItem] = Field(default_factory=list)
    chronology_of_events: List[ChronologyItem] = Field(default_factory=list)
    issues: List[str] = Field(default_factory=list)
    legal_issues: List[str] = Field(default_factory=list)
    claims: List[str] = Field(default_factory=list)
    facts: List[str] = Field(default_factory=list)
    relief_requested: str = Field(default="Not specified")
    evidence_list: List[str] = Field(default_factory=list)
    supporting_evidence: List[str] = Field(default_factory=list)
    issue_evidence_matrix: List[IssueEvidenceItem] = Field(default_factory=list)
    annexure_list: List[AnnexureItem] = Field(default_factory=list)
    annexure_index: List[AnnexureItem] = Field(default_factory=list)
    missing_documents: List[str] = Field(default_factory=list)
    missing_evidence: List[str] = Field(default_factory=list)
    potential_inconsistencies: List[str] = Field(default_factory=list)
    consistency_warnings: List[str] = Field(default_factory=list)
    limitation_warning: Optional[str] = None
    draft_pleading: Dict[str, str] = Field(default_factory=dict)
    applicable_legal_provisions: List[Dict[str, Any]] = Field(default_factory=list)
    relevant_judgments: List[Dict[str, Any]] = Field(default_factory=list)
    completeness_status: str = Field(default="INCOMPLETE")  # COMPLETE | PARTIAL | INCOMPLETE
    court_compliance_disclaimer: str = Field(
        default="Preliminary completeness check passed. Professional/legal review may still be required."
    )
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
