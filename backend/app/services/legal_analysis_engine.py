"""
legal_analysis_engine.py — Unified legal analysis: rights, applicable laws, and judgments.
Uses the existing RAG pipeline (app.rag.retriever) for grounded retrieval.
"""
import json
import logging
import re
from typing import AsyncGenerator, Dict, Any, List
from app.services.llm import get_groq_client, PRIMARY_MODEL, _is_rate_limit_error, _gemini_fallback

logger = logging.getLogger(__name__)

LEGAL_ANALYSIS_SYSTEM_PROMPT = """You are an expert Indian Legal AI analyst. Output your response as a valid JSON object.
Given a case description and retrieved legal documents/judgments, produce a structured legal analysis in JSON format.

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
- Output strictly valid JSON format.
"""

KNOWN_JUDGMENTS_DATABASE = {
    "shreya singhal": {
        "case_name": "Shreya Singhal v. Union of India",
        "court": "Supreme Court of India",
        "year": "2015",
        "citation": "AIR 2015 SC 1523",
        "principle": "Struck down Section 66A of the Information Technology Act, 2000 in its entirety as unconstitutional for violating freedom of speech under Article 19(1)(a).",
        "relevance": "Landmark precedent establishing digital free speech protection and invalidating vague penal restrictions on internet communication."
    },
    "puttaswamy": {
        "case_name": "K.S. Puttaswamy (Retd.) v. Union of India",
        "court": "Supreme Court of India",
        "year": "2017",
        "citation": "(2017) 10 SCC 1",
        "principle": "Unanimously affirmed that the Right to Privacy is a fundamental right protected under Article 21 and Part III of the Constitution of India.",
        "relevance": "Governs informational privacy, bodily autonomy, surveillance restrictions, and personal data protection."
    },
    "kesavananda": {
        "case_name": "Kesavananda Bharati v. State of Kerala",
        "court": "Supreme Court of India",
        "year": "1973",
        "citation": "AIR 1973 SC 1461",
        "principle": "Established the Basic Structure Doctrine ruling that Parliament cannot alter essential constitutional features through amendments under Article 368.",
        "relevance": "Primary constitutional benchmark protecting fundamental rights and judicial review from parliamentary overreach."
    },
    "vishaka": {
        "case_name": "Vishaka & Ors. v. State of Rajasthan",
        "court": "Supreme Court of India",
        "year": "1997",
        "citation": "AIR 1997 SC 3011",
        "principle": "Laid down mandatory Vishaka Guidelines for workplace prevention and redressal of sexual harassment of women under Articles 14, 19, and 21.",
        "relevance": "Foundational precedent for workplace safety, gender equality, and statutory POSH compliance."
    },
    "maneka gandhi": {
        "case_name": "Maneka Gandhi v. Union of India",
        "court": "Supreme Court of India",
        "year": "1978",
        "citation": "AIR 1978 SC 597",
        "principle": "Expanded Article 21 right to personal liberty, ruling that state procedures restricting personal liberty must be just, fair, and reasonable.",
        "relevance": "Established the 'golden triangle' (Articles 14, 19, and 21) guaranteeing natural justice and freedom to travel."
    },
    "indra sawhney": {
        "case_name": "Indra Sawhney v. Union of India",
        "court": "Supreme Court of India",
        "year": "1993",
        "citation": "AIR 1993 SC 477",
        "principle": "Upheld 27% OBC reservation, instituted the 50% ceiling cap on total reservations, and established the creamy layer exclusion principle.",
        "relevance": "Governs affirmative action, reservation caps, and backward class eligibility criteria."
    },
    "bommai": {
        "case_name": "S.R. Bommai v. Union of India",
        "court": "Supreme Court of India",
        "year": "1994",
        "citation": "AIR 1994 SC 1918",
        "principle": "Restricted arbitrary imposition of President's Rule under Article 356 and held Secularism to be part of the Basic Structure.",
        "relevance": "Key precedent protecting state autonomy and federal balance against executive dissolution."
    },
    "adm jabalpur": {
        "case_name": "ADM Jabalpur v. Shivkant Shukla",
        "court": "Supreme Court of India",
        "year": "1976",
        "citation": "AIR 1976 SC 1207",
        "principle": "Infamous Emergency ruling on habeas corpus suspension, later overruled by K.S. Puttaswamy (2017).",
        "relevance": "Historical precedent regarding emergency powers and fundamental right suspensions."
    }
}

def _build_grounded_fallback_analysis(question: str, category: str, docs: list) -> Dict[str, Any]:
    """
    Synthesizes a structured legal analysis directly from retrieved ChromaDB documents and metadata
    when LLM services are offline or rate-limited.
    """
    applicable_laws = []
    relevant_judgments = []
    user_rights = []
    possible_remedies = []

    seen_acts = set()
    seen_cases = set()

    for doc in docs:
        meta = getattr(doc, 'metadata', {}) or {}
        content = getattr(doc, 'page_content', '') or ''

        doc_type = meta.get('document_type', '').lower()
        act_name = meta.get('act_name') or meta.get('source') or ''
        case_name = meta.get('case_name') or (act_name if 'v.' in act_name or 'vs' in act_name.lower() else '')
        section = meta.get('section') or meta.get('article') or meta.get('primary_article') or ''
        holding = meta.get('holding') or ''
        citation = meta.get('citation') or ''
        court = meta.get('court') or 'Supreme Court of India'
        year = meta.get('year') or ''

        if doc_type == 'judgment' or case_name or 'v.' in act_name or 'vs' in act_name.lower():
            c_key = (case_name or act_name).strip().lower()
            if c_key and c_key not in seen_cases:
                seen_cases.add(c_key)
                relevant_judgments.append({
                    "case_name": case_name or act_name,
                    "court": court,
                    "year": str(year),
                    "principle": holding or content[:200].replace('\n', ' ') + "...",
                    "relevance": f"Key precedent governing {meta.get('legal_topics', 'this area of Indian law')}.",
                    "citation": citation
                })
        else:
            a_key = f"{act_name}_{section}".strip().lower()
            if act_name and a_key not in seen_acts:
                seen_acts.add(a_key)
                applicable_laws.append({
                    "act": act_name,
                    "section": f"Section/Article {section}" if section else "Statutory Provision",
                    "provision": content[:250].replace('\n', ' ') + "...",
                    "relevance": f"Statutory framework under {act_name}."
                })

    q_lower = question.lower()

    # Check known database judgments matching prompt keywords
    for key, jdata in KNOWN_JUDGMENTS_DATABASE.items():
        if key in q_lower or jdata["case_name"].lower() in q_lower:
            c_key = jdata["case_name"].lower()
            if c_key not in seen_cases:
                seen_cases.add(c_key)
                relevant_judgments.append(jdata)

    # Domain specific rights & remedies fallback if not enough extracted
    if "rti" in q_lower or "information" in q_lower:
        if not applicable_laws:
            applicable_laws.append({
                "act": "Right to Information Act, 2005",
                "section": "Section 6 & Section 7",
                "provision": "Grants citizens the right to request public information with a mandatory 30-day response timeline.",
                "relevance": "Provides statutory entitlement to inspect public records and receive certified copies."
            })
        user_rights = [
            "Right to file an RTI application under Section 6 with any Public Information Officer (PIO).",
            "Right to receive response within 30 days (or 48 hours if life and liberty are involved).",
            "Right to file First Appeal under Section 19(1) if information is denied or delayed."
        ]
        possible_remedies = [
            {
                "remedy": "RTI Application Filing",
                "description": "Submit a formal RTI application along with Rs. 10 fee to the designated PIO.",
                "forum": "Public Information Officer (PIO) / First Appellate Authority"
            }
        ]
    elif "legal aid" in q_lower or "section 12" in q_lower or "lsa" in q_lower or "free" in q_lower:
        if not applicable_laws:
            applicable_laws.append({
                "act": "Legal Services Authorities Act, 1987",
                "section": "Section 12",
                "provision": "Defines statutory criteria for free legal aid (women, children, SC/ST, low income, victims of trafficking).",
                "relevance": "Establishes entitlement to free legal representation and court fee waivers."
            })
        user_rights = [
            "Right to free legal services under Section 12 if you belong to eligible categories (women, SC/ST, low income).",
            "Right to assignment of an empanelled legal aid advocate without legal fees.",
            "Right to representation at Lok Adalat and court proceedings through DLSA / NALSA."
        ]
        possible_remedies = [
            {
                "remedy": "DLSA Legal Aid Application",
                "description": "Submit a legal aid application with income/category proof to your local District Legal Services Authority.",
                "forum": "District Legal Services Authority (DLSA) / State Legal Services Authority (SLSA)"
            }
        ]
    elif "66a" in q_lower or "shreya singhal" in q_lower or "speech" in q_lower:
        if not applicable_laws:
            applicable_laws.append({
                "act": "Information Technology Act, 2000",
                "section": "Section 66A (Struck Down)",
                "provision": "Former penal provision for sending offensive messages through communication services.",
                "relevance": "Struck down as unconstitutional under Article 19(1)(a) by the Supreme Court."
            })
        user_rights = [
            "Right to freedom of speech and expression on digital platforms under Article 19(1)(a).",
            "Protection against arrest under unconstitutional and struck-down provisions (Section 66A IT Act).",
            "Right to challenge arbitrary online content removal or criminal charges."
        ]
        possible_remedies = [
            {
                "remedy": "Quashing of Illegal Proceedings / FIR",
                "description": "Petition the High Court to quash invalid charges under Section 66A IT Act citing Shreya Singhal precedent.",
                "forum": "High Court (Article 226 / Section 482 CrPC/BNSS)"
            }
        ]
    else:
        user_rights = [
            "Right to issue a formal legal notice outlining factual claims and statutory remedies.",
            "Right to access dispute resolution through Lok Adalat or DLSA legal aid.",
            "Right to fair hearing and due process under Indian statutory law."
        ]
        possible_remedies = [
            {
                "remedy": "Pre-Litigation Notice & Settlement",
                "description": "Serve a formal statutory legal demand notice detailing claims and monetary recovery.",
                "forum": "Appropriate Legal Forum / DLSA Mediation Cell"
            }
        ]

    act_summary = applicable_laws[0]["act"] if applicable_laws else "Indian Statutory Law"
    case_summary_text = f" Supported by precedent: {relevant_judgments[0]['case_name']}." if relevant_judgments else ""
    summary = f"Based on your query regarding '{question}', legal provisions under {act_summary} apply.{case_summary_text}"

    return {
        "applicable_laws": applicable_laws,
        "user_rights": user_rights,
        "possible_remedies": possible_remedies,
        "relevant_judgments": relevant_judgments,
        "legal_disclaimer": "This is AI-generated legal information grounded in indexed Indian statutes and precedents, not formal legal advice. Consult a qualified advocate for advice specific to your situation.",
        "summary": summary,
        "sources_count": len(docs)
    }

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

    q_clean = re.sub(r'[^\w\s]', '', question.lower()).strip()
    greeting_set = {
        "hi", "hii", "hiii", "hello", "hey", "heyy", "greetings", "good morning",
        "good afternoon", "good evening", "namaste", "namaskar", "help", "who are you",
        "what can you do", "test", "thanks", "thank you", "hi nyaya", "hello nyaya"
    }
    has_legal_keywords = any(k in q_clean for k in ["act", "law", "sec", "fir", "rti", "court", "my", "i", "case", "legal", "notice", "rights"])

    if q_clean in greeting_set or (len(q_clean) < 6 and not has_legal_keywords):
        from app.services.intent_classifier import get_greeting_message
        return {
            "applicable_laws": [],
            "user_rights": [
                "Right to consult legal information and seek advice for your specific situation.",
                "Right to confidentiality and privacy when describing your legal issue."
            ],
            "possible_remedies": [],
            "relevant_judgments": [],
            "legal_disclaimer": "This is AI-generated legal assistance.",
            "summary": get_greeting_message(language),
            "sources_count": 0
        }

    case_info = case_info or {}
    category = case_info.get("category", "")
    sub_category = case_info.get("sub_category", "")
    issue = case_info.get("issue", question)
    location = case_info.get("location", "")

    search_query = f"{question} {category} {sub_category}".strip()
    
    try:
        docs = await run_in_threadpool(retrieve, search_query, k=6)
    except Exception as e:
        logger.error(f"RAG retrieval failed in legal_analysis: {e}")
        docs = []

    # Build context
    context_parts = []
    for doc in docs:
        source = doc.metadata.get("act_name") or doc.metadata.get("case_name") or doc.metadata.get("source") or "Legal Document"
        section = doc.metadata.get("section") or doc.metadata.get("article") or doc.metadata.get("primary_article") or ""
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

    # Grounded fallback using retrieved ChromaDB documents and metadata
    return _build_grounded_fallback_analysis(question, category, docs)


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
            cit_str = f" [{j.get('citation')}]" if j.get('citation') else ""
            lines.append(f"• **{j.get('case_name', '')}** ({j.get('court', '')}, {j.get('year', '')}){cit_str}: {j.get('principle', '')} — *{j.get('relevance', '')}*")
    else:
        lines.append("### Relevant Judgments")
        lines.append("*No verified judgments found in the available legal database for this specific situation.*")

    lines.append("")
    lines.append(f"*⚠️ {analysis.get('legal_disclaimer', 'This is legal information, not legal advice.')}*")

    return "\n".join(lines)
