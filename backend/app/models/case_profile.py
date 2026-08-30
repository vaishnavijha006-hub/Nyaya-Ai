"""
case_profile.py — Data models for the Case Understanding Engine.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ExtractedFactItem(BaseModel):
    field: str
    value: Any
    source: str = Field(default="user_message")
    confidence: float = Field(default=0.95)


class FactConflict(BaseModel):
    field: str
    existing_value: Any
    new_value: Any
    conflict_message: str = Field(
        default="FACT CONFLICT: The new information contradicts previously stored information. Please clarify which value is correct."
    )


class CaseProfile(BaseModel):
    case_category: Optional[str] = None
    subcategory: Optional[str] = None
    parties: Optional[str] = None
    incident_date: Optional[str] = None
    incident_location: Optional[str] = None
    chronology: List[Dict[str, Any]] = Field(default_factory=list)
    claims: List[str] = Field(default_factory=list)
    opposite_party: Optional[str] = None
    harm_suffered: Optional[str] = None
    relief_requested: Optional[str] = None
    documents_available: List[str] = Field(default_factory=list)
    missing_documents: List[str] = Field(default_factory=list)
    important_unanswered_questions: List[str] = Field(default_factory=list)
    
    # Provenance and Conflict Tracking
    extracted_facts: List[ExtractedFactItem] = Field(default_factory=list)
    conflicts: List[FactConflict] = Field(default_factory=list)
    has_active_conflict: bool = False
    next_single_question: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
