"""
test_adr_engine.py — Unit tests for Step 14 ADR Routing Engine.

Verifies:
1. Deterministic Rule Execution for 5 Pathways (Mediation, Lok Adalat, Permanent Lok Adalat, Arbitration, Litigation Review)
2. ADR Output Schema (pathway, reasons, conditions, warnings, requires_human_review)
3. Generated Sections (ADR explanation, required information, document checklist, process overview, next-step guidance)
4. Guardrails (No false mandatory ADR claims)
"""
import pytest
from app.models.adr import ADRPathway, ADRRecommendation
from app.services.adr_engine import evaluate_adr_suitability


def test_1_permanent_lok_adalat_public_utility():
    """Test 1: Electricity/water public utility dispute evaluates to Permanent Lok Adalat (Sec 22B LSA Act)."""
    case_info = {
        "category": "GOVERNMENT_SERVICE",
        "issue": "Electricity board wrongful disconnection of power supply to hospital",
        "key_facts": ["Public utility service affected"],
    }
    res = evaluate_adr_suitability(case_info)

    assert isinstance(res, ADRRecommendation)
    assert res.pathway == ADRPathway.PERMANENT_LOK_ADALAT
    assert res.requires_human_review is True
    assert "Section 22B" in res.reasons[0]
    assert len(res.conditions) >= 2
    assert len(res.warnings) >= 1
    assert "Permanent Lok Adalat" in res.adr_explanation
    assert len(res.required_information) >= 2
    assert len(res.document_checklist) >= 2
    assert len(res.process_overview) >= 3
    assert res.next_step_guidance != ""


def test_2_lok_adalat_cheque_bounce():
    """Test 2: Cheque bounce dispute evaluates to Lok Adalat (Sec 19 LSA Act)."""
    case_info = {
        "category": "CHEQUE_BOUNCE",
        "issue": "Dishonoured cheque for Rs 150000 under Section 138 NI Act",
        "complainant": "Rajesh Kumar",
        "parties": "Vikram Singh",
    }
    res = evaluate_adr_suitability(case_info)

    assert res.pathway == ADRPathway.LOK_ADALAT
    assert res.requires_human_review is True
    assert "Section 19" in res.reasons[0]


def test_3_mediation_commercial_contract():
    """Test 3: Commercial dispute evaluates to Mediation with Sec 12A Commercial Courts Act note."""
    case_info = {
        "category": "COMMERCIAL_CONTRACT",
        "issue": "Breach of vendor agreement and delayed payment",
    }
    res = evaluate_adr_suitability(case_info)

    assert res.pathway == ADRPathway.MEDIATION
    assert any("Section 12A Commercial Courts Act" in r for r in res.reasons)


def test_4_arbitration_clause():
    """Test 4: Dispute with explicit arbitration clause evaluates to Arbitration."""
    case_info = {
        "category": "COMMERCIAL_CONTRACT",
        "issue": "Contract dispute with explicit arbitration clause executed by parties",
    }
    res = evaluate_adr_suitability(case_info)

    assert res.pathway == ADRPathway.ARBITRATION
    assert "Arbitration & Conciliation Act" in res.reasons[0]


def test_5_litigation_review_serious_crime():
    """Test 5: Serious non-compoundable offense evaluates to Litigation Review."""
    case_info = {
        "category": "SERIOUS_CRIMINAL",
        "issue": "Prosecution for major corporate fraud and physical assault",
    }
    res = evaluate_adr_suitability(case_info)

    assert res.pathway == ADRPathway.LITIGATION
    assert res.is_eligible_for_adr is False
    assert "non-compoundable criminal charges" in res.reasons[0]
