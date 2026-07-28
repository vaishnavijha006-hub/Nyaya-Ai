"""
insights.py — iNSIGHTS Deep Search service layer for Nyaya AI.

Purpose:
    Sends legal research queries to the iNSIGHTS AI Deep Search API and returns
    structured sources / citations that are merged with RAG vector results before
    LLM generation.

Integration status:
    ⚠  PLACEHOLDER — the real iNSIGHTS endpoint URL and authentication scheme
    must be filled in once credentials are issued for the hackathon.

Environment variables (set in backend/.env):
    INSIGHTS_API_KEY   — Bearer token / API key for the iNSIGHTS service
    INSIGHTS_URL       — Base URL of the iNSIGHTS search endpoint

How to activate:
    1. Replace INSIGHTS_URL with the real endpoint.
    2. Replace INSIGHTS_API_KEY with your hackathon key.
    3. The pipeline.py will automatically include iNSIGHTS context once
       fetch_insights_context() returns non-empty results.
"""

import os
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

_INSIGHTS_URL     = os.getenv("INSIGHTS_URL", "")
_INSIGHTS_API_KEY = os.getenv("INSIGHTS_API_KEY", "")

# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def fetch_insights_context(query: str) -> str:
    """
    Query the iNSIGHTS Deep Search API and return a formatted context string
    suitable for injection into the RAG LLM prompt.

    Returns:
        A plain-text context string with retrieved sources, or an empty string
        if iNSIGHTS is not configured / unavailable (so the pipeline degrades
        gracefully to local vector search only).

    Response contract expected from iNSIGHTS API:
        {
            "results": [
                {
                    "title":   str,   # e.g. "Article 21 – Right to Life"
                    "snippet": str,   # Relevant passage / excerpt
                    "url":     str,   # Source URL or citation reference
                    "score":   float  # Relevance score (optional)
                },
                ...
            ]
        }
    """
    if not _INSIGHTS_URL or not _INSIGHTS_API_KEY:
        logger.warning(
            "[insights] INSIGHTS_URL or INSIGHTS_API_KEY is not set — "
            "skipping iNSIGHTS Deep Search. Set both in backend/.env to activate."
        )
        return ""

    # ── Validate that this looks like a real URL (not the placeholder) ────────
    if "example.com" in _INSIGHTS_URL:
        logger.warning("[insights] INSIGHTS_URL still points to the example placeholder — skipping.")
        return ""

    logger.info(f"[insights] Querying iNSIGHTS Deep Search for: {query!r}")

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                _INSIGHTS_URL,
                headers={
                    "Authorization": f"Bearer {_INSIGHTS_API_KEY}",
                    "Content-Type":  "application/json",
                },
                json={"query": query, "top_k": 5},
            )
            response.raise_for_status()

        data    = response.json()
        results = data.get("results", [])

        if not results:
            logger.info("[insights] iNSIGHTS returned 0 results.")
            return ""

        # ── Format results into a context block ───────────────────────────────
        parts = []
        for i, item in enumerate(results, start=1):
            title   = item.get("title",   "Unknown source")
            snippet = item.get("snippet", "").strip()
            url     = item.get("url",     "")
            parts.append(
                f"[iNSIGHTS Source {i}] {title}\n"
                f"{snippet}\n"
                f"Reference: {url}"
            )

        context_block = "\n\n---\n\n".join(parts)
        logger.info(f"[insights] Retrieved {len(results)} iNSIGHTS sources.")
        return context_block

    except httpx.TimeoutException:
        logger.error("[insights] Request to iNSIGHTS timed out — continuing without it.")
        return ""
    except httpx.HTTPStatusError as exc:
        logger.error(f"[insights] iNSIGHTS returned HTTP {exc.response.status_code} — skipping.")
        return ""
    except Exception as exc:
        logger.error(f"[insights] Unexpected error: {exc} — skipping.")
        return ""
