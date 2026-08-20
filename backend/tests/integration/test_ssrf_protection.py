import pytest
from unittest.mock import patch, MagicMock

# Simulated SSRF protection logic
def fetch_url(url):
    forbidden_networks = ['127.0.0.0/8', '169.254.169.254']
    if any(forbidden in url for forbidden in forbidden_networks):
        raise ValueError("SSRF Attack Detected")
    if "localhost" in url:
        raise ValueError("SSRF Attack Detected")
    return "OK"

def test_localhost_fetching():
    with pytest.raises(ValueError, match="SSRF Attack Detected"):
        fetch_url("http://localhost:8080/admin")
        
def test_aws_metadata_subnet():
    with pytest.raises(ValueError, match="SSRF Attack Detected"):
        fetch_url("http://169.254.169.254/latest/meta-data/")

def test_malicious_redirect_loop():
    def fetch_with_redirect(url, redirects=0):
        if redirects > 5:
            raise ValueError("Too many redirects - Possible malicious loop")
        return fetch_with_redirect(url, redirects + 1)
        
    with pytest.raises(ValueError, match="Too many redirects"):
        fetch_with_redirect("http://example.com/redirect")
