"""
test_case_profile_engine.py — Unit tests for Step 4 Case Understanding Engine.

Verifies:
1. Progressive 13-field Case Profile Construction
2. Extracted Fact Provenance & Confidence Scores
3. Fact Conflict Detection (Prevents silent overwrites, flags FACT CONFLICT)
4. Single Progressive Questioning (Asks 1 question at a time)
"""
import pytest
from app.services.case_profile_engine import build_progressive_case_profile
from app.models.case_profile import CaseProfile


def test_1_case_profile_construction():
    """Test 1: Progressively constructs 13-field Case Profile."""
    msg = "My landlord Mr. Ramesh illegally locked me out of my flat on 18 August in Delhi."
    profile = build_progressive_case_profile(msg)

    assert profile.case_category == "RENTAL_DISPUTE"
    assert profile.subcategory == "Illegal Lockout"
    assert profile.incident_date == "18 August"
    assert profile.incident_location == "Delhi"
    assert profile.opposite_party == "Landlord"
    assert len(profile.chronology) > 0
    assert len(profile.claims) > 0
    assert profile.harm_suffered is not None
    assert profile.relief_requested is not None


def test_2_fact_confidence_provenance():
    """Test 2: Facts recorded include confidence scores."""
    msg = "Cheque bounced on 15 July 2026."
    profile = build_progressive_case_profile(msg)

    assert len(profile.extracted_facts) > 0
    date_fact = next((f for f in profile.extracted_facts if f.field == "incident_date"), None)
    assert date_fact is not None
    assert date_fact.confidence >= 0.90
    assert date_fact.source == "user_message"


def test_3_fact_conflict_detection():
    """Test 3: Flag FACT CONFLICT when new information contradicts stored info."""
    # Turn 1: Initial date 18 August
    turn1_msg = "Incident happened on 18 August in Delhi."
    profile_turn1 = build_progressive_case_profile(turn1_msg)
    assert profile_turn1.incident_date == "18 August"
    assert profile_turn1.has_active_conflict is False

    # Turn 2: Contradicting date 20 August
    turn2_msg = "Actually it happened on 20 August."
    profile_turn2 = build_progressive_case_profile(turn2_msg, current_profile=profile_turn1)

    # Must NOT silently overwrite; must flag conflict
    assert profile_turn2.has_active_conflict is True
    assert len(profile_turn2.conflicts) > 0
    assert profile_turn2.conflicts[0].field == "incident_date"
    assert profile_turn2.conflicts[0].existing_value == "18 August"
    assert profile_turn2.conflicts[0].new_value == "20 August"
    assert "FACT CONFLICT" in profile_turn2.next_single_question


def test_4_single_progressive_questioning():
    """Test 4: Asks only ONE question at a time."""
    msg = "My landlord locked me out."
    profile = build_progressive_case_profile(msg)

    assert profile.next_single_question is not None
    # Ensure only 1 question is asked, not a 20-question dump
    assert "?" in profile.next_single_question
    assert profile.next_single_question.count("?") == 1
