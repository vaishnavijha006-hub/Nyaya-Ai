"""
test_explainability_engine.py — Unit tests for Step 17 AI Explainability Engine.

Verifies:
1. 7 Explainability Components (Recommendation, Factors, Evidence, Sources, Missing Info, Uncertainty, Human Review)
2. Concise Markdown Formatting ("RECOMMENDATION:", "WHY?", "UNCERTAINTY:", "HUMAN REVIEW:")
3. Omission of Hidden Chain-of-Thought (CoT)
"""
import pytest
from app.models.explainability import RecommendationExplainability
from app.services.explainability_engine import generate_explainability


def test_1_full_7_component_explainability():
    """Test 1: Generates complete RecommendationExplainability with all 7 components."""
    case_info = {
        "category": "RENTAL_DISPUTE",
        "issue": "Landlord locked me out without notice",
        "complainant": "Tenant A",
        "parties": "Landlord B",
        "urgency": "Normal",
        "key_facts": ["Lease fully paid"],
    }
    session_state = {
        "documents_uploaded": [{"filename": "rent_agreement.pdf"}],
        "legal_analysis": {
            "applicable_laws": [{"act": "Delhi Rent Control Act, 1958", "section": "Section 14"}]
        },
    }

    exp = generate_explainability(
        recommendation_text="Consider mediation first.",
        case_info=case_info,
        session_state=session_state,
        factors=["Monetary dispute", "Ongoing relationship", "No emergency detected", "Both parties identifiable"],
        uncertainty_note="Settlement outcome cannot be predicted.",
    )

    assert isinstance(exp, RecommendationExplainability)
    assert exp.recommendation == "Consider mediation first."
    assert "Monetary dispute" in exp.factors_considered
    assert "rent_agreement.pdf" in exp.evidence_considered
    assert any("Delhi Rent Control Act" in s for s in exp.legal_sources_used)
    assert exp.confidence_uncertainty["uncertainty"] == "Settlement outcome cannot be predicted."
    assert exp.human_review_requirement["requires_human_review"] is True


def test_2_markdown_formatting_structure():
    """Test 2: Verifies formatted markdown matches prompt specification."""
    case_info = {"category": "RENTAL_DISPUTE", "issue": "Rent lockout"}
    exp = generate_explainability(
        recommendation_text="Consider mediation first.",
        case_info=case_info,
        factors=["Monetary dispute", "Ongoing relationship", "No emergency detected"],
        uncertainty_note="Settlement outcome cannot be predicted.",
    )

    md = exp.format_explainability_markdown()

    assert "RECOMMENDATION:" in md
    assert "Consider mediation first." in md
    assert "WHY?" in md
    assert "✓ Monetary dispute" in md
    assert "✓ Ongoing relationship" in md
    assert "UNCERTAINTY:" in md
    assert "Settlement outcome cannot be predicted." in md
    assert "HUMAN REVIEW:" in md
    assert "Recommended." in md


def test_3_hidden_cot_omitted():
    """Test 3: Ensures internal chain-of-thought is never exposed."""
    case_info = {"category": "CHEQUE_BOUNCE", "issue": "Section 138 notice"}
    exp = generate_explainability("File Lok Adalat pre-litigation application.", case_info)

    md_str = exp.format_explainability_markdown().lower()
    model_str = str(exp.model_dump()).lower()

    assert "chain_of_thought" not in md_str
    assert "thinking" not in md_str
    assert "chain_of_thought" not in model_str
    assert "thinking" not in model_str
