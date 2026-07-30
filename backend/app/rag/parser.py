"""
parser.py — Modular Legal Reference Parser for Indian Statutes & Constitutions.
Parses Articles, Sections, Parts, Chapters, and ranges into structured metadata.
Explicitly avoids matching ordinary numbered lists: 1., (1), (a), (i).
"""

import re
from typing import Dict, Any, Optional

# --- INDIVIDUAL PATTERNS ---

# 1. ARTICLE <number> / Article <number> (e.g. ARTICLE 19, Article 300A, ARTICLE 239AA, Article 21A)
_P_ARTICLE = re.compile(r'\b(?:ARTICLE|Article)\s+(\d+[A-Z]{0,2})\b')

# 2. Art. <number> / ART. <number> (e.g. Art. 19, Art. 32A)
_P_ART_SHORT = re.compile(r'\b(?:ART\.|Art\.)\s*(\d+[A-Z]{0,2})\b')

# 3. Arts. <range> / ARTS. <range> (e.g. Arts. 18-19, Arts. 19—21)
_P_ART_RANGE = re.compile(r'\b(?:ARTS\.|Arts\.)\s*(\d+[A-Z]?)\s*[-–—]\s*(\d+[A-Z]?)\b')

# 4. Standalone article heading (e.g., "51A. It shall be...", "21. No person...") at start of line or block
_P_STANDALONE_ART = re.compile(r'^(?:1\[)?(\d+[A-Z]{0,2})\.\s+[A-Z]', re.MULTILINE)

# 5. SECTION <number> / Section <number> (e.g. SECTION 138, Section 3)
_P_SECTION = re.compile(r'\b(?:SECTION|Section)\s+(\d+[A-Z]{0,2})\b')

# 6. Sec. <number> / SEC. <number> (e.g. Sec. 3, Sec. 66A)
_P_SEC_SHORT = re.compile(r'\b(?:SEC\.|Sec\.)\s*(\d+[A-Z]{0,2})\b')

# 7. Secs. <range> / SECS. <range> (e.g. Secs. 3-5, Secs. 66-68)
_P_SEC_RANGE = re.compile(r'\b(?:SECS\.|Secs\.)\s*(\d+[A-Z]?)\s*[-–—]\s*(\d+[A-Z]?)\b')

# 8. Standalone section heading (e.g., "173. (1) Information...", "Report of 193. (1)", "43.(1)")
_P_STANDALONE_SEC = re.compile(r'(?:^|\b|\n|\.|\))\s*(\d+[A-Z]{0,2})\.\s*(?:\(\d+\)|\s+[A-Z])', re.MULTILINE)

# 9. Part / Chapter / Schedule (e.g. Part IVA, CHAPTER II, Schedule I)
_P_PART = re.compile(r'\bPART\s+([I|V|X|L|C|D|M|A-Z0-9]+)\b', re.IGNORECASE)
_P_CHAPTER = re.compile(r'\bCHAPTER\s+([I|V|X|L|C|D|M|a-z0-9]+)\b', re.IGNORECASE)
_P_SCHEDULE = re.compile(r'\bSCHEDULE\s+([I|V|X|L|C|D|M|A-Z0-9]+)\b', re.IGNORECASE)


def parse_legal_references(text: str) -> Dict[str, Any]:
    """
    Parses legal headings and references from text snippet into standardized dictionary.
    Returns:
        {
            "article": str or None,
            "section": str or None,
            "article_range": str or None,
            "section_range": str or None,
            "heading_type": str or None,
            "part": str or None,
            "chapter": str or None
        }
    """
    res = {
        "article": None,
        "section": None,
        "article_range": None,
        "section_range": None,
        "heading_type": None,
        "part": None,
        "chapter": None,
    }

    if not text:
        return res

    # Check Article Patterns
    m_art = _P_ARTICLE.search(text)
    if m_art:
        res["article"] = m_art.group(1)
        res["heading_type"] = "ARTICLE"
    else:
        m_art_short = _P_ART_SHORT.search(text)
        if m_art_short:
            res["article"] = m_art_short.group(1)
            res["heading_type"] = "ART_SHORT"

    m_art_range = _P_ART_RANGE.search(text)
    if m_art_range:
        res["article_range"] = f"{m_art_range.group(1)}-{m_art_range.group(2)}"
        if not res["article"]:
            res["article"] = m_art_range.group(1)  # Anchor on start of range
            res["heading_type"] = "ARTS_RANGE"

    if not res["article"]:
        m_standalone = _P_STANDALONE_ART.search(text)
        if m_standalone:
            res["article"] = m_standalone.group(1)
            res["heading_type"] = "STANDALONE_ARTICLE"

    # Check Section Patterns
    m_sec = _P_SECTION.search(text)
    if m_sec:
        res["section"] = m_sec.group(1)
        res["heading_type"] = res["heading_type"] or "SECTION"
    else:
        m_sec_short = _P_SEC_SHORT.search(text)
        if m_sec_short:
            res["section"] = m_sec_short.group(1)
            res["heading_type"] = res["heading_type"] or "SEC_SHORT"

    m_sec_range = _P_SEC_RANGE.search(text)
    if m_sec_range:
        res["section_range"] = f"{m_sec_range.group(1)}-{m_sec_range.group(2)}"
        if not res["section"]:
            res["section"] = m_sec_range.group(1)
            res["heading_type"] = res["heading_type"] or "SECS_RANGE"

    if not res["section"]:
        m_standalone_sec = _P_STANDALONE_SEC.search(text)
        if m_standalone_sec:
            res["section"] = m_standalone_sec.group(1)
            res["heading_type"] = res["heading_type"] or "STANDALONE_SECTION"

    # Check Part / Chapter / Schedule
    m_part = _P_PART.search(text)
    if m_part:
        res["part"] = m_part.group(1)

    m_chap = _P_CHAPTER.search(text)
    if m_chap:
        res["chapter"] = m_chap.group(1)

    m_sched = _P_SCHEDULE.search(text)
    if m_sched:
        res["schedule"] = m_sched.group(1)

    return res


def is_legal_heading_start(text: str) -> bool:
    """
    Checks if a block starts with a genuine legal heading.
    Prevents matching ordinary lists: 1., (1), (a), (i).
    """
    # Exclude ordinary list prefixes explicitly
    if re.match(r'^\s*(?:\(\d+\)|\([a-z]\)|\([i|v|x]+\))\s+', text):
        return False

    return bool(
        _P_ARTICLE.match(text) or
        _P_ART_SHORT.match(text) or
        _P_ART_RANGE.match(text) or
        _P_STANDALONE_ART.match(text) or
        _P_SECTION.match(text) or
        _P_SEC_SHORT.match(text) or
        _P_SEC_RANGE.match(text) or
        _P_STANDALONE_SEC.match(text) or
        _P_PART.match(text) or
        _P_CHAPTER.match(text) or
        _P_SCHEDULE.match(text)
    )
