import pytest
from unittest.mock import patch, MagicMock

# Simulated Emergency Precedence logic
class EmergencySafety:
    @staticmethod
    def activate():
        return "FAIL_OPEN_ACTIVE"

def process_request(db_timeout=False, cache_timeout=False):
    if db_timeout or cache_timeout:
        return EmergencySafety.activate()
    return "SUCCESS"

def test_redis_timeout_activates_emergency_safety():
    assert process_request(cache_timeout=True) == "FAIL_OPEN_ACTIVE"

def test_postgres_timeout_activates_emergency_safety():
    assert process_request(db_timeout=True) == "FAIL_OPEN_ACTIVE"

def test_normal_operation():
    assert process_request() == "SUCCESS"
