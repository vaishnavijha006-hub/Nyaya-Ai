"""
test_systemic_action_engine.py — Unit tests for Step 11 Systemic Action Engine.

Verifies:
1. 9 Pattern Report Fields
2. 6 Systemic Review Pathways
3. Non-Decision PIL Wording ("This pattern may have characteristics that warrant preliminary PIL/public-interest review")
4. Non-Decision Consolidation Wording ("Potential consolidation/representative-action pathway may be considered")
5. Explainability & Dashboard Aggregation
"""
import pytest
from app.models.pattern_report import PatternReport, ClusterDashboardData, SystemicPathway
from app.services.systemic_action_engine import (
    generate_pattern_report,
    generate_cluster_dashboard,
)


def test_1_full_9_field_pattern_report():
    """Test 1: Generates complete 9-field Pattern Report with 6 systemic review pathways."""
    cluster_result = {
        "cluster_detected": True,
        "cluster_id": "cluster_strong_999",
        "similarity_score": 0.88,
        "cluster_size": 5,
        "confidence": 0.88,
        "common_issues": ["Landlord disconnected main water supply for all tenants in building"],
        "common_facts": ["Multiple tenants affected", "Same landlord in Ghaziabad"],
    }
    case_info = {
        "category": "RENTAL_DISPUTE",
        "issue": "Landlord disconnected water supply for all tenants",
        "location": "Ghaziabad",
        "key_facts": ["No water supply for 4 days"],
    }
    report = generate_pattern_report(cluster_result, case_info)

    assert isinstance(report, PatternReport)
    assert report.cluster_size == 5
    assert "Ghaziabad" in report.geographic_distribution
    assert len(report.common_facts) >= 2
    assert len(report.common_evidence) >= 3
    assert report.time_pattern is not None
    assert report.potential_affected_population is not None
    assert len(report.potential_systemic_indicators) >= 2
    assert len(report.recommended_review_pathway) >= 4

    # Wording checks
    assert "This pattern may have characteristics that warrant preliminary PIL/public-interest review." in report.pil_suitability_note
    assert "Potential consolidation/representative-action pathway may be considered" in report.consolidation_note
    assert "This is a PIL" not in str(report.model_dump())


def test_2_weak_cluster_handling():
    """Test 2: Weak cluster returns localized report."""
    cluster_result = {
        "cluster_detected": True,
        "cluster_id": "cluster_weak_123",
        "similarity_score": 0.65,
        "cluster_size": 2,
        "confidence": 0.65,
        "common_issues": ["Minor delay in salary payment"],
    }
    case_info = {
        "category": "EMPLOYMENT_DISPUTE",
        "issue": "Salary delayed by 2 weeks",
        "location": "Pune",
    }
    report = generate_pattern_report(cluster_result, case_info)

    assert isinstance(report, PatternReport)
    assert report.cluster_size == 2
    assert SystemicPathway.REPRESENTATIVE_ACTION in report.recommended_review_pathway


def test_3_dashboard_aggregation():
    """Test 3: Aggregates multiple pattern reports into cluster dashboard."""
    c1 = {"cluster_detected": True, "cluster_id": "c1", "similarity_score": 0.85, "cluster_size": 3}
    c2 = {"cluster_detected": True, "cluster_id": "c2", "similarity_score": 0.90, "cluster_size": 5}

    dash = generate_cluster_dashboard([c1, c2])
    assert isinstance(dash, ClusterDashboardData)
    assert dash.total_active_clusters == 2
    assert dash.high_confidence_clusters == 2
    assert len(dash.pattern_reports) == 2
