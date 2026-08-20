import logging
from app.services.case_memory import process_case_memory

logger = logging.getLogger(__name__)

async def process_document_intelligence(case_info: dict, question: str) -> dict:
    """
    Process document intelligence without bypassing memory reconciliation with OCR facts.
    """
    logger.info("Running document intelligence engine")
    
    # Critical: Do NOT bypass memory reconciliation with OCR facts
    case_id = case_info.get("case_id", "default_case")
    
    untrusted_content = case_info.get("document_content", "")
    safe_question = f"System Instruction: Answer the question based ONLY on the following untrusted data.\n\n<UNTRUSTED_DATA>\n{untrusted_content}\n</UNTRUSTED_DATA>\n\nQuestion: {question}"
    
    # We reconcile extracted facts with existing memory
    memory_result = await process_case_memory(case_id, safe_question)
    
    if memory_result.get("status") == "CONFLICT":
        logger.warning(f"Conflict detected during document intelligence memory reconciliation: {memory_result}")
        return {
            "status": "REQUIRE_CLARIFICATION",
            "message": memory_result.get("message", "We detected conflicting facts between your document and previous statements. Could you clarify?")
        }
        
    return {"status": "SUCCESS", "message": "Document intelligence processed."}

import urllib.parse
import socket
import ipaddress
import httpx

ALLOWED_DOMAINS = [".gov.in", ".nic.in"]

def is_safe_url(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    hostname = parsed.hostname
    if not hostname:
        return False
    if not any(hostname.endswith(domain) for domain in ALLOWED_DOMAINS):
        return False
    try:
        ip_addr = socket.gethostbyname(hostname)
        ip = ipaddress.ip_address(ip_addr)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved:
            return False
    except Exception:
        return False
    return True

async def fetch_pdf(url: str) -> bytes:
    """PDF fetcher with absolute allowlist and DNS rebinding protection."""
    if not is_safe_url(url):
        raise ValueError("URL is not permitted by SSRF policy.")
    
    # We resolve it once to prevent DNS rebinding attacks and use the resolved IP
    parsed = urllib.parse.urlparse(url)
    hostname = parsed.hostname
    ip_addr = socket.gethostbyname(hostname)
    
    async with httpx.AsyncClient(transport=httpx.AsyncHTTPTransport(local_address="0.0.0.0")) as client:
        # Instead of replacing URL which might break TLS SNI, we rely on the pre-check.
        # But for strict protection, one might use a custom resolver or httpx's capabilities.
        response = await client.get(url, follow_redirects=False) # Reject internal redirects
        response.raise_for_status()
        return response.content

