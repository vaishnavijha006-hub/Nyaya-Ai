"""
test_pathway_router.py — Unit tests for the Legal Pathway Router Engine.
"""
import pytest
from app.models.pathway import LegalPathway, PathwayRecommendation
from app.services.pathway_router import route_legal_pathway


def test_safety_concern_pathway():
    case_info = {
        "category": "DOMESTIC_VIOLENCE",
        "has_immediate_safety_concern": True,
        "issue": "Immediate threat of physical violence",
        "classification_status": "INCOMPLETE",
    }
    rec = route_legal_pathway(case_info)
    assert isinstance(rec, PathwayRecommendation)
    assert rec.recommended_path == LegalPathway.INDIVIDUAL_LITIGATION
    assert rec.requires_human_review is True
    assert rec.metadata.get("safety_alert") is True
    assert rec.confidence >= 0.90


def test_incomplete_case_pathway():
    case_info = {
        "category": "RENTAL_DISPUTE",
        "classification_status": "INCOMPLETE",
        "missing_information": ["lockout_date", "rent_agreement_exists", "police_informed"],
        "issue": "Locked out of apartment",
    }
    rec = route_legal_pathway(case_info)
    assert rec.recommended_path == LegalPathway.DOCUMENT_COMPLETION
    assert rec.requires_human_review is True
    assert "Missing fields" in rec.reasons[1]


def test_pil_pathway():
    case_info = {
        "category": "ENVIRONMENTAL_PUBLIC",
        "issue": "Toxic factory waste polluting drinking water for entire village community",
        "key_facts": ["Affects 5000 residents", "Public health hazard", "Government policy violation"],
        "classification_status": "COMPLETE",
    }
    rec = route_legal_pathway(case_info)
    assert rec.recommended_path == LegalPathway.PIL_REVIEW
    assert rec.requires_human_review is True
    assert LegalPathway.CLUSTER_REVIEW in rec.alternative_paths or LegalPathway.INDIVIDUAL_LITIGATION in rec.alternative_paths


def test_cluster_case_pathway():
    case_info = {
        "category": "RENTAL_DISPUTE",
        "issue": "Landlord disconnected water supply for all tenants in the building",
        "key_facts": ["Affects other tenants", "Same landlord", "Multiple victims in block"],
        "classification_status": "COMPLETE",
    }
    rec = route_legal_pathway(case_info)
    assert rec.recommended_path == LegalPathway.CLUSTER_REVIEW
    assert rec.requires_human_review is True


def test_legal_aid_pathway():
    case_info = {
        "category": "EMPLOYMENT_DISPUTE",
        "issue": "Unpaid salary for 4 months",
        "classification_status": "COMPLETE",
    }
    session_state = {
        "eligibility_result": True,
        "eligibility_reasons": ["Income below Rs 300,000 threshold under Section 12 NALSA"],
    }
    rec = route_legal_pathway(case_info, session_state)
    assert rec.recommended_path == LegalPathway.LEGAL_AID
    assert rec.requires_human_review is True
    assert rec.confidence == 0.90


def test_regulatory_referral_pathway():
    case_info = {
        "category": "CONSUMER_DISPUTE",
        "issue": "Defective laptop purchased from online vendor",
        "classification_status": "COMPLETE",
    }
    rec = route_legal_pathway(case_info)
    assert rec.recommended_path == LegalPathway.REGULATORY_REFERRAL
    assert rec.requires_human_review is True
    assert "Consumer Disputes Redressal Commission" in rec.reasons[0]


def test_mediation_pathway():
    case_info = {
        "category": "RENTAL_DISPUTE",
        "issue": "Dispute over security deposit refund",
        "case_stage": "pre_litigation",
        "classification_status": "COMPLETE",
    }
    rec = route_legal_pathway(case_info)
    assert rec.recommended_path in [LegalPathway.MEDIATION, LegalPathway.SETTLEMENT, LegalPathway.LOK_ADALAT_REVIEW]
    assert rec.requires_human_review is True


def test_individual_litigation_default():
    case_info = {
        "category": "PROPERTY_DISPUTE",
        "issue": "Encroachment on ancestral land property boundary",
        "case_stage": "litigation",
        "classification_status": "COMPLETE",
    }
    rec = route_legal_pathway(case_info)
    assert rec.recommended_path == LegalPathway.INDIVIDUAL_LITIGATION
    assert rec.requires_human_review is True
