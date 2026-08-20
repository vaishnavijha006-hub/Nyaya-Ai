import pytest
from app.services.legal_rag import query_temporal_rag

def test_multi_year_transition_requires_human_review():
    result = query_temporal_rag("What were the compliance laws?", 2020, 2023)
    assert result == "HUMAN_REVIEW_REQUIRED"

def test_single_year_interpolates():
    result = query_temporal_rag("What were the compliance laws?", 2021, 2022)
    assert result != "HUMAN_REVIEW_REQUIRED"
