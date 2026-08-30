"""
test_pil_engine.py — Unit tests for Step 12 PIL Suitability Engine.

Verifies:
1. 8 Factor Analysis
2. 4 Outcomes (HIGHER INDICATION, MODERATE INDICATION, LOW INDICATION, INSUFFICIENT INFORMATION)
3. Non-Decision Framing ("This matter shows characteristics that may warrant preliminary PIL review.")
4. Complete PIL Review Brief (Problem, Affected Population, Pattern Evidence, Public Interest Indicators, Existing Remedies, Questions for Lawyer)
"""
import pytest
from app.models.pil_analysis import PILSuitabilityResult, PILSuitabilityOutcome, PILReviewBrief
from app.services.pil_engine import evaluate_pil_suitability


def test_1_higher_indication_pil():
    """Test 1: Environmental health hazard affecting community returns HIGHER INDICATION & Brief."""
    case_info = {
        "category": "ENVIRONMENTAL_PUBLIC",
        "issue": "Toxic chemical waste dumping in river causing drinking water contamination for entire village",
        "key_facts": ["Thousands of residents affected", "Public health hazard reported to municipal corporation"],
        "location": "Kanpur",
        "cluster_size": 6,
    }
    result, brief = evaluate_pil_suitability(case_info)

    assert isinstance(result, PILSuitabilityResult)
    assert result.potential_suitability == PILSuitabilityOutcome.HIGHER_INDICATION
    assert result.potential_pil is True
    assert result.confidence >= 0.80
    assert len(result.reasons) >= 2
    assert result.requires_legal_review is True

    # Wording check
    assert "AI has determined" not in result.assessment_framing
    assert "This matter shows characteristics that may warrant preliminary PIL review." in result.assessment_framing

    # Brief check
    assert isinstance(brief, PILReviewBrief)
    assert brief.problem != ""
    assert brief.affected_population != ""
    assert len(brief.pattern_evidence) >= 1
    assert len(brief.public_interest_indicators) >= 2
    assert len(brief.existing_remedies) >= 2
    assert len(brief.questions_requiring_lawyer_review) >= 3


def test_2_low_indication_private_dispute():
    """Test 2: Isolated private dispute returns LOW INDICATION."""
    case_info = {
        "category": "RENTAL_DISPUTE",
        "issue": "Landlord delayed refunding security deposit for 1 month",
        "key_facts": ["Deposit amount Rs 25000", "Individual lease agreement"],
        "location": "Bangalore",
    }
    result, brief = evaluate_pil_suitability(case_info)

    assert isinstance(result, PILSuitabilityResult)
    assert result.potential_suitability == PILSuitabilityOutcome.LOW_INDICATION
    assert result.potential_pil is False
    assert len(result.counter_indicators) >= 1


def test_3_insufficient_information():
    """Test 3: Incomplete case facts return INSUFFICIENT INFORMATION."""
    case_info = {
        "category": "GENERAL",
        "issue": "",
        "classification_status": "INCOMPLETE",
    }
    result, brief = evaluate_pil_suitability(case_info)

    assert isinstance(result, PILSuitabilityResult)
    assert result.potential_suitability == PILSuitabilityOutcome.INSUFFICIENT_INFORMATION
    assert brief is None


def test_4_strict_framing_check():
    """Test 4: Verifies AI PIL declarations are NEVER produced."""
    case_info = {
        "category": "PUBLIC_HEALTH",
        "issue": "Hospital refusing emergency treatment to children",
        "key_facts": ["Vulnerable population affected"],
        "location": "Delhi",
    }
    result, brief = evaluate_pil_suitability(case_info)

    full_str = str(result.model_dump())
    assert "ai has determined this is a pil" not in full_str.lower()
    assert "This matter shows characteristics that may warrant preliminary PIL review." in result.assessment_framing
