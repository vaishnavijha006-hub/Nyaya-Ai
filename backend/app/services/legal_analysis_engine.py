"""
legal_analysis_engine.py — Unified legal analysis: rights, applicable laws, and judgments.
Uses the existing RAG pipeline (app.rag.retriever) for grounded retrieval.
"""
import json
import logging
from typing import AsyncGenerator, Dict, Any, List
from app.services.llm import get_groq_client, PRIMARY_MODEL, _is_rate_limit_error, _gemini_fallback

logger = logging.getLogger(__name__)

LEGAL_ANALYSIS_SYSTEM_PROMPT = """You are an expert Indian Legal AI analyst.
Given a case description and retrieved legal documents/judgments, produce a structured legal analysis.

Return ONLY valid JSON with this structure:
{
  "applicable_laws": [
    {
      "act": "Name of the Act",
      "section": "Section number",
      "provision": "What the section says",
      "relevance": "Why it applies to this case"
    }
  ],
  "user_rights": [
    "Right 1 in plain language",
    "Right 2 in plain language"
  ],
  "possible_remedies": [
    {
      "remedy": "Name of remedy",
      "description": "How to pursue it",
      "forum": "Where to file/apply"
    }
  ],
  "relevant_judgments": [
    {
      "case_name": "Full case title",
      "court": "Court name",
      "year": "Year",
      "principle": "Legal principle established",
      "relevance": "Why it matters here",
      "citation": "Citation if available"
    }
  ],
  "legal_disclaimer": "Standard disclaimer about this being information not advice",
  "summary": "2-3 sentence plain-language summary of the legal situation"
}

CRITICAL RULES:
- NEVER fabricate case names, sections, or judgments.
- Only include judgments explicitly mentioned in the retrieved context.
- If no verified judgment is found, set relevant_judgments to [] and note it in the summary.
- Use "appears to", "generally", "typically" for legal positions — avoid absolute assertions.
- Keep user_rights in simple, plain language.
"""

async def run_legal_analysis(
    case_info: dict,
    question: str,
    language: str = "en",
    history_str: str = "",
    audience: str = "default",
) -> Dict[str, Any]:
    """
    Run legal analysis using the real RAG pipeline.
    Returns structured analysis with laws, rights, remedies, judgments.
    """
    from app.rag.retriever import retrieve
    from fastapi.concurrency import run_in_threadpool

    # Build a targeted search query from case info
    case_info = case_info or {}
    category = case_info.get("category", "")
    sub_category = case_info.get("sub_category", "")
    issue = case_info.get("issue", question)
    location = case_info.get("location", "")

    search_query = f"{issue} {category} {sub_category} rights remedies India {location}".strip()
    if not category and not sub_category:
        search_query = f"{question} India law"
    
    try:
        docs = await run_in_threadpool(retrieve, search_query, k=6)
    except Exception as e:
        logger.error(f"RAG retrieval failed in legal_analysis: {e}")
        docs = []

    # Build context
    context_parts = []
    for doc in docs:
        source = doc.metadata.get("act_name") or doc.metadata.get("source") or "Legal Document"
        section = doc.metadata.get("section") or doc.metadata.get("primary_article") or ""
        ref = f" | {section}" if section else ""
        context_parts.append(f"[{source}{ref}]\n{doc.page_content}")
    context = "\n\n---\n\n".join(context_parts) if context_parts else "No specific legal documents retrieved."

    client = get_groq_client()
    prompt = (
        f"Case Category: {category} / {sub_category}\n"
        f"Issue: {issue}\n"
        f"Location: {location}\n"
        f"Facts: {json.dumps(case_info.get('key_facts', []))}\n"
        f"User Question: {question}\n\n"
        f"Retrieved Legal Context:\n{context}\n\n"
        f"Analyze and return JSON."
    )

    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": LEGAL_ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=1500,
        )
        result = json.loads(response.choices[0].message.content)
        result["sources_count"] = len(docs)
        return result
    except Exception as exc:
        if _is_rate_limit_error(exc):
            logger.warning("Groq rate limited in legal_analysis, falling back to Gemini")
            fallback_prompt = LEGAL_ANALYSIS_SYSTEM_PROMPT + "\n\nOUTPUT ONLY VALID JSON.\n\n" + prompt
            raw = _gemini_fallback(fallback_prompt, "").strip()
            try:
                # Extract json from markdown block if present
                import re
                match = re.search(r'```(?:json)?\s*([\s\S]*?)```', raw)
                if match:
                    raw = match.group(1)
                result = json.loads(raw)
                result["sources_count"] = len(docs)
                return result
            except Exception as e:
                logger.error(f"Failed to parse Gemini fallback: {e}")
        else:
            logger.error(f"legal_analysis failed: {exc}")

    return {
        "applicable_laws": [],
        "user_rights": ["Could not retrieve legal analysis at this time. Please try again."],
        "possible_remedies": [],
        "relevant_judgments": [],
        "legal_disclaimer": "This is AI-generated legal information, not legal advice. Consult a qualified advocate for advice specific to your situation.",
        "summary": "Legal analysis could not be completed. Please try again.",
        "sources_count": 0,
    }


def format_legal_analysis_message(analysis: Dict[str, Any]) -> str:
    """Format the legal analysis as a readable chat message."""
    lines = ["## Legal Analysis\n"]

    if analysis.get("summary"):
        lines.append(f"{analysis['summary']}\n")

    laws = analysis.get("applicable_laws", [])
    if laws:
        lines.append("### Applicable Laws")
        for law in laws[:5]:
            lines.append(f"• **{law.get('act', '')} – {law.get('section', '')}**: {law.get('provision', '')} *({law.get('relevance', '')})*")
        lines.append("")

    rights = analysis.get("user_rights", [])
    if rights:
        lines.append("### Your Rights")
        for r in rights:
            lines.append(f"• {r}")
        lines.append("")

    remedies = analysis.get("possible_remedies", [])
    if remedies:
        lines.append("### Possible Remedies")
        for rem in remedies:
            lines.append(f"• **{rem.get('remedy', '')}** ({rem.get('forum', '')}): {rem.get('description', '')}")
        lines.append("")

    judgments = analysis.get("relevant_judgments", [])
    if judgments:
        lines.append("### Relevant Judgments")
        for j in judgments:
            lines.append(f"• **{j.get('case_name', '')}** ({j.get('court', '')}, {j.get('year', '')}): {j.get('principle', '')} — *{j.get('relevance', '')}*")
    else:
        lines.append("### Relevant Judgments")
        lines.append("*No verified judgments found in the available legal database for this specific situation.*")

    lines.append("")
    lines.append(f"*⚠️ {analysis.get('legal_disclaimer', 'This is legal information, not legal advice.')}*")

    return "\n".join(lines)
