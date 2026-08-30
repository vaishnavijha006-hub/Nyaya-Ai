"""
test_cluster_engine.py — Unit tests for Step 10 Case Clustering Engine.

Verifies:
1. PII Removal (Names, phone, email, addresses, IDs)
2. Similar Cases Clustering (Cases A, B, C form semantic cluster)
3. Unrelated Cases Isolation
4. Threshold Behavior (Similarity threshold filtering)
5. Cross-User Isolation (Identity stored separately, vector payloads anonymized)
6. Cluster Creation Output & Non-Identical Framing ("These cases show semantic similarities")
"""
import pytest
from app.models.cluster import ClusterDetectionResult
from app.services.cluster_engine import ClusterEngine, anonymize_case_data


def test_1_pii_removal():
    """Test 1: PII Scrubbing removes names, phone numbers, emails, addresses, and IDs."""
    raw_case = {
        "category": "RENTAL_DISPUTE",
        "issue": "Mr. Ramesh Sharma locked me out of flat 402 at 9876543210 ramesh@gmail.com",
        "key_facts": ["Lease with Mr. Ramesh Sharma", "Aadhaar 1234 5678 9101"],
        "location": "South Delhi",
    }
    anon = anonymize_case_data(raw_case)

    # Raw PII should be scrubbed
    assert "9876543210" not in anon["scrubbed_issue"]
    assert "ramesh@gmail.com" not in anon["scrubbed_issue"]
    assert "flat 402" not in anon["scrubbed_issue"].lower()
    assert "1234 5678 9101" not in " ".join(anon["scrubbed_facts"])
    assert "[PHONE]" in anon["scrubbed_issue"] or "[EMAIL]" in anon["scrubbed_issue"]


def test_2_similar_cases_cluster_detection():
    """Test 2: Similar cases (Lockout complaints A, B, C) form a semantic cluster."""
    engine = ClusterEngine()

    case_a = {
        "category": "RENTAL_DISPUTE",
        "issue": "My landlord changed the lock without notice",
        "key_facts": ["Rent fully paid", "Locked out yesterday"],
        "location": "South Delhi",
    }
    case_b = {
        "category": "RENTAL_DISPUTE",
        "issue": "I was prevented from entering my rented home by landlord",
        "key_facts": ["Keys changed", "Access denied"],
        "location": "South Delhi",
    }

    # Index Case A
    engine.add_case_to_index("case_101", case_a, tenant_id="user_a")

    # Detect cluster for Case B
    result = engine.detect_cluster_for_case(case_b, tenant_id="user_b", threshold=0.70)

    assert isinstance(result, ClusterDetectionResult)
    assert result.cluster_detected is True
    assert result.number_of_cases >= 2
    assert result.similarity_score >= 0.70
    assert "semantic similarities" in result.message
    assert "legally identical" not in result.message


def test_3_unrelated_cases_no_cluster():
    """Test 3: Unrelated cases (Cheque bounce vs Rental lockout) do NOT form a cluster."""
    engine = ClusterEngine()

    case_rental = {
        "category": "RENTAL_DISPUTE",
        "issue": "Landlord locked me out of apartment",
        "key_facts": ["Rent paid"],
        "location": "Delhi",
    }
    case_cheque = {
        "category": "CHEQUE_BOUNCE",
        "issue": "Cheque dishonoured due to insufficient funds in bank",
        "key_facts": ["Section 138 notice"],
        "location": "Mumbai",
    }

    engine.add_case_to_index("case_rental_1", case_rental, tenant_id="user_1")

    # High threshold search for cheque bounce against rental
    result = engine.detect_cluster_for_case(case_cheque, tenant_id="user_2", threshold=0.85)

    assert result.cluster_detected is False
    assert result.number_of_cases == 1


def test_4_threshold_behavior():
    """Test 4: Configurable similarity threshold filters candidate clusters."""
    engine = ClusterEngine()

    case_1 = {"category": "EMPLOYMENT_DISPUTE", "issue": "Unpaid salary dues for 2 months", "location": "Bangalore"}
    case_2 = {"category": "EMPLOYMENT_DISPUTE", "issue": "Employer withheld salary payment", "location": "Bangalore"}

    engine.add_case_to_index("emp_1", case_1)

    # Threshold = 0.99 (strict) should not cluster unless identical
    result_strict = engine.detect_cluster_for_case(case_2, threshold=0.99)
    # Threshold = 0.65 (relaxed) should cluster
    result_relaxed = engine.detect_cluster_for_case(case_2, threshold=0.65)

    assert result_relaxed.cluster_detected is True
    assert result_strict.cluster_detected is False or result_strict.similarity_score < 0.99


def test_5_cross_user_isolation():
    """Test 5: Vector payload stores only anonymized summary and never raw user PII."""
    engine = ClusterEngine()

    case_private = {
        "category": "RENTAL_DISPUTE",
        "issue": "Landlord Mr. Secret locked out Priya Verma at 9999999999",
        "key_facts": ["Private fact"],
        "location": "Delhi",
    }

    engine.add_case_to_index("private_case_99", case_private, tenant_id="tenant_secret")

    points = engine.client.scroll(collection_name="nyaya_case_clusters")[0]
    assert len(points) > 0
    payload = points[0].payload

    # Payload must not contain private PII
    assert "9999999999" not in str(payload)
    assert "Priya Verma" not in str(payload)
    assert "Mr. Secret" not in str(payload)


def test_6_cluster_creation_output():
    """Test 6: Creates structured ClusterDetectionResult with required fields."""
    engine = ClusterEngine()

    c1 = {"category": "CONSUMER_DISPUTE", "issue": "Online seller refused product refund", "location": "Noida"}
    c2 = {"category": "CONSUMER_DISPUTE", "issue": "Merchant denied refund for defective goods", "location": "Noida"}

    engine.add_case_to_index("c1", c1)
    res = engine.detect_cluster_for_case(c2, threshold=0.70)

    assert res.cluster_detected is True
    assert res.cluster_id is not None
    assert res.number_of_cases >= 2
    assert res.common_issue is not None
    assert len(res.common_entities) > 0
    assert res.geographic_pattern is not None
    assert res.requires_human_review is True
