"""
classifier.py — Query Classification, Legal Reference & Target Document/Judgment Extraction Module for Nyaya AI.

Categorizes user queries into distinct classes:
- exact_article_lookup
- exact_section_lookup
- chapter_lookup
- part_lookup
- schedule_lookup
- judgment_lookup
- precedent_lookup
- case_summary
- case_comparison
- constitutional_interpretation
- comparative_legal_question
- procedural_question
- multilingual_question
- semantic_legal_question
"""

import re
from typing import Dict, Any, Optional

_HINDI_CHAR_RE = re.compile(r'[\u0900-\u097F]')

_ARTICLE_RE = re.compile(r'\b(?:Art(?:icle)?\.?|अनुच्छेद)\s*(\d+[A-Z]*)\b', re.IGNORECASE)
_SECTION_RE = re.compile(r'\b(?:Sec(?:tion)?\.?|धारा)\s*(\d+[A-Z]*)\b', re.IGNORECASE)
_CHAPTER_RE = re.compile(r'\b(?:Chapter|अध्याय)\s*([IVXLCDM0-9]+)\b', re.IGNORECASE)
_PART_RE = re.compile(r'\b(?:Part|भाग)\s*([IVXLCDM0-9]+[A-Z]*)\b', re.IGNORECASE)
_SCHEDULE_RE = re.compile(r'\b(?:Schedule|अनुसूची)\s*([IVXLCDM0-9]+)\b', re.IGNORECASE)

_KNOWN_JUDGMENTS_PATTERNS = [
    (re.compile(r'\b(?:Kesavananda|Kesavananda Bharati|Basic Structure Case)\b', re.IGNORECASE), "Kesavananda Bharati v. State of Kerala"),
    (re.compile(r'\b(?:Maneka|Maneka Gandhi)\b', re.IGNORECASE), "Maneka Gandhi v. Union of India"),
    (re.compile(r'\b(?:Puttaswamy|K\.?S\.?\s*Puttaswamy|Privacy Case|Right to Privacy Case)\b', re.IGNORECASE), "K.S. Puttaswamy (Retd.) v. Union of India"),
    (re.compile(r'\b(?:Vishaka|Vishaka Guidelines|Workplace Sexual Harassment Case)\b', re.IGNORECASE), "Vishaka & Ors. v. State of Rajasthan"),
    (re.compile(r'\b(?:Shreya|Shreya Singhal|Section 66A Case|struck down Section 66A)\b', re.IGNORECASE), "Shreya Singhal v. Union of India"),
    (re.compile(r'\b(?:Bommai|S\.?R\.?\s*Bommai|Presidents Rule Case)\b', re.IGNORECASE), "S.R. Bommai v. Union of India"),
    (re.compile(r'\b(?:Indra Sawhney|Mandal Case|Reservation Case|50 Percent Cap|reservation ceiling cap)\b', re.IGNORECASE), "Indra Sawhney v. Union of India"),
    (re.compile(r'\b(?:Golaknath|Golak Nath|I\.?C\.?\s*Golaknath)\b', re.IGNORECASE), "I.C. Golaknath v. State of Punjab"),
    (re.compile(r'\b(?:ADM Jabalpur|Habeas Corpus Case|Shivkant Shukla|emergency Article 359 case)\b', re.IGNORECASE), "ADM Jabalpur v. Shivkant Shukla"),
    (re.compile(r'\b(?:Minerva Mills|Minerva Mills Case)\b', re.IGNORECASE), "Minerva Mills Ltd. v. Union of India"),
]

_JUDGMENT_KEYWORDS_RE = re.compile(
    r'\b(?:case|judgment|precedent|landmark|held|supreme court|high court|bench|ruling|verdict|v\.|vs\.?|versus|'
    r'kesavananda|maneka|puttaswamy|vishaka|shreya|bommai|indra sawhney|golaknath|adm jabalpur|minerva mills|'
    r'basic structure|right to privacy|workplace harassment|sexual harassment|section 66a|presidents rule|habeas corpus|creamy layer|50 percent cap)\b',
    re.IGNORECASE
)

_CASE_COMPARISON_RE = re.compile(
    r'\b(?:compare|comparison|versus|vs|difference|distinguish)\b.*\b(?:case|judgment|precedent|vs\.?|versus)\b|'
    r'\b(?:kesavananda|maneka|puttaswamy|vishaka|shreya|bommai|golaknath|indra sawhney|adm jabalpur|minerva mills).*\b(?:and|with|versus|vs)\b.*\b(?:kesavananda|maneka|puttaswamy|vishaka|shreya|bommai|golaknath|indra sawhney|adm jabalpur|minerva mills)\b',
    re.IGNORECASE
)
_CASE_SUMMARY_RE = re.compile(r'\b(?:summary|explain|details|holding|what was|facts of|what happened|significance of)\b.*\b(?:case|judgment|precedent|v\.|vs\.?)\b', re.IGNORECASE)
_PRECEDENT_RE = re.compile(r'\b(?:precedent|landmark|ratio decendi|obiter|ruling|held in|bench|recognized|struck down|established|associated with)\b', re.IGNORECASE)
_CONST_INTERP_RE = re.compile(r'\b(?:basic structure|privacy|personal liberty|freedom of speech|secularism|reservations|habeas corpus)\b', re.IGNORECASE)

_COMPARATIVE_RE = re.compile(r'\b(?:difference|versus|vs|compare|comparison|distinguish)\b', re.IGNORECASE)
_PROCEDURAL_RE = re.compile(r'\b(?:procedure|process|how to|steps|file|apply|appeal)\b', re.IGNORECASE)

# Act detection mapping
_ACT_PATTERNS = [
    (re.compile(r'\b(?:Constitution|संविधान)\b', re.IGNORECASE), "Constitution of India"),
    (re.compile(r'\b(?:BNS|Bharatiya Nyaya Sanhita)\b', re.IGNORECASE), "Bharatiya Nyaya Sanhita"),
    (re.compile(r'\b(?:BNSS|Bharatiya Nagarik Suraksha Sanhita)\b', re.IGNORECASE), "Bharatiya Nagarik Suraksha Sanhita"),
    (re.compile(r'\b(?:BSA|Bharatiya Sakshya Adhiniyam)\b', re.IGNORECASE), "Bharatiya Sakshya Adhiniyam"),
    (re.compile(r'\b(?:RTI|Right to Information)\b', re.IGNORECASE), "Right to Information Act"),
    (re.compile(r'\b(?:Consumer Protection|CPA)\b', re.IGNORECASE), "Consumer Protection Act"),
    (re.compile(r'\b(?:IT Act|Information Technology)\b', re.IGNORECASE), "Information Technology Act"),
    (re.compile(r'\b(?:Motor Vehicles|MVA)\b', re.IGNORECASE), "Motor Vehicles Act"),
]


def detect_target_act(query: str) -> Optional[str]:
    """Detects explicit Act/Document mentions in query."""
    for pattern, canonical_name in _ACT_PATTERNS:
        if pattern.search(query):
            return canonical_name
    return None


def detect_target_judgment(query: str) -> Optional[str]:
    """Detects explicit Judgment mentions / aliases in query."""
    for pattern, canonical_name in _KNOWN_JUDGMENTS_PATTERNS:
        if pattern.search(query):
            return canonical_name
    return None


def is_judgment_query(query: str) -> bool:
    """Returns True if the query explicitly targets case law / judgments / precedents."""
    return bool(_JUDGMENT_KEYWORDS_RE.search(query) or detect_target_judgment(query))


def is_act_query(query: str) -> bool:
    """Returns True if the query explicitly asks for Articles/Sections/Acts."""
    return bool(_ARTICLE_RE.search(query) or _SECTION_RE.search(query) or detect_target_act(query))


def classify_query(query: str) -> Dict[str, Any]:
    """
    Analyzes user query and returns classification, detected language, target document, and extracted metadata.
    """
    is_hindi = bool(_HINDI_CHAR_RE.search(query))
    lang = "hi" if is_hindi else "en"

    art_match = _ARTICLE_RE.search(query)
    sec_match = _SECTION_RE.search(query)
    chap_match = _CHAPTER_RE.search(query)
    part_match = _PART_RE.search(query)
    sched_match = _SCHEDULE_RE.search(query)
    target_act = detect_target_act(query)
    target_judgment = detect_target_judgment(query)
    has_judgment_kw = is_judgment_query(query)

    extracted_meta = {}
    if art_match:
        extracted_meta["article"] = art_match.group(1).upper()
    if sec_match:
        extracted_meta["section"] = sec_match.group(1).upper()
    if chap_match:
        extracted_meta["chapter"] = chap_match.group(1).upper()
    if part_match:
        extracted_meta["part"] = part_match.group(1).upper()
    if sched_match:
        extracted_meta["schedule"] = sched_match.group(1).upper()
    if target_act:
        extracted_meta["act_name"] = target_act
    if target_judgment:
        extracted_meta["case_name"] = target_judgment

    # Determine query category
    if _CASE_COMPARISON_RE.search(query):
        category = "case_comparison"
    elif target_judgment:
        category = "exact_case_lookup" if ("explain" in query.lower() or "summary" in query.lower() or "case" in query.lower()) else "judgment_lookup"
    elif _CASE_SUMMARY_RE.search(query):
        category = "case_summary"
    elif _PRECEDENT_RE.search(query):
        category = "precedent_lookup"
    elif has_judgment_kw and not (art_match or sec_match):
        category = "judgment_lookup"
    elif _CONST_INTERP_RE.search(query) and has_judgment_kw:
        category = "constitutional_interpretation"
    elif art_match:
        category = "exact_article_lookup"
    elif sec_match:
        category = "exact_section_lookup"
    elif chap_match:
        category = "chapter_lookup"
    elif part_match:
        category = "part_lookup"
    elif sched_match:
        category = "schedule_lookup"
    elif _COMPARATIVE_RE.search(query):
        category = "comparative_legal_question"
    elif _PROCEDURAL_RE.search(query):
        category = "procedural_question"
    elif is_hindi:
        category = "multilingual_question"
    else:
        category = "semantic_legal_question"

    return {
        "category": category,
        "language": lang,
        "is_multilingual": is_hindi,
        "target_act": target_act,
        "target_judgment": target_judgment,
        "is_judgment_query": has_judgment_kw,
        "metadata": extracted_meta,
    }
