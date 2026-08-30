"""
explainability.py — Data models for Step 17 AI Explainability Layer.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RecommendationExplainability(BaseModel):
    recommendation: str = Field(..., description="1. Recommendation")
    factors_considered: List[str] = Field(default_factory=list, description="2. Factors considered")
    evidence_considered: List[str] = Field(default_factory=list, description="3. Evidence considered")
    legal_sources_used: List[str] = Field(default_factory=list, description="4. Legal sources used")
    missing_information: List[str] = Field(default_factory=list, description="5. Missing information")
    confidence_uncertainty: Dict[str, Any] = Field(
        default_factory=lambda: {
            "confidence": 0.85,
            "uncertainty": "Settlement or legal outcome cannot be guaranteed."
        },
        description="6. Confidence / uncertainty"
    )
    human_review_requirement: Dict[str, Any] = Field(
        default_factory=lambda: {
            "requires_human_review": True,
            "note": "Recommended."
        },
        description="7. Human review requirement"
    )
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

    def format_explainability_markdown(self) -> str:
        """
        Formats the 7 components into clean, human-readable markdown.
        Exposes ONLY concise decision factors and evidence without chain-of-thought dumps.
        """
        lines = [
            "RECOMMENDATION:",
            f"{self.recommendation}",
            "",
            "WHY?"
        ]
        
        for factor in self.factors_considered:
            lines.append(f"✓ {factor}")

        if self.evidence_considered:
            lines.append("")
            lines.append("EVIDENCE CONSIDERED:")
            for ev in self.evidence_considered:
                lines.append(f"• {ev}")

        if self.legal_sources_used:
            lines.append("")
            lines.append("LEGAL SOURCES USED:")
            for src in self.legal_sources_used:
                lines.append(f"• {src}")

        if self.missing_information:
            lines.append("")
            lines.append("MISSING INFORMATION:")
            for m in self.missing_information:
                lines.append(f"• ❓ {m}")

        lines.extend([
            "",
            "UNCERTAINTY:",
            f"{self.confidence_uncertainty.get('uncertainty', 'Legal outcome cannot be predicted.')}",
            "",
            "HUMAN REVIEW:",
            f"{self.human_review_requirement.get('note', 'Recommended.')}"
        ])

        return "\n".join(lines)
