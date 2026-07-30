"""
memory.py — Conversation Memory for Nyaya AI Phase 11.

Extends ConversationMemory to track:
- last discussed judgment
- last discussed act
- multi-turn case comparisons (e.g. Maneka Gandhi -> Kesavananda -> Compare both)
"""

from __future__ import annotations

import re
import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

# Legal entity patterns
_ARTICLE_RE = re.compile(r'\b(?:ARTICLE|Article|ART\.?|Art\.?)\s*(\d{1,3}[A-Z]?)\b|(?<!\w)(\d{1,3}[A-Z])\.\s', re.IGNORECASE)
_SECTION_RE = re.compile(r'\b(?:SECTION|Section|SEC\.?|Sec\.?)\s*(\d+[A-Z]?)\b', re.IGNORECASE)
_PART_RE = re.compile(r'\bPart\s+([IVXLCDM]+|\d+)\b', re.IGNORECASE)
_CHAPTER_RE = re.compile(r'\bChapter\s+([IVXLCDM]+|\d+)\b', re.IGNORECASE)
_SCHEDULE_RE = re.compile(r'\bSchedule\s+([IVXLCDM]+|\d+)\b|\b(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth)\s+Schedule\b', re.IGNORECASE)

_ACT_NAMES = [
    "Constitution of India", "Constitution",
    "Bharatiya Nyaya Sanhita", "BNS",
    "Bharatiya Nagarik Suraksha Sanhita", "BNSS",
    "Bharatiya Sakshya Adhiniyam", "BSA",
    "Right to Information Act", "RTI Act", "RTI",
    "Consumer Protection Act", "CPA",
    "Information Technology Act", "IT Act",
    "Motor Vehicles Act", "MVA",
]
_ACT_RE = re.compile(r'\b(' + '|'.join(re.escape(a) for a in sorted(_ACT_NAMES, key=len, reverse=True)) + r')\b', re.IGNORECASE)

_JUDGMENT_NAMES = [
    "Kesavananda Bharati", "Kesavananda",
    "Maneka Gandhi", "Maneka",
    "K.S. Puttaswamy", "Puttaswamy",
    "Vishaka",
    "Shreya Singhal", "Shreya",
    "S.R. Bommai", "Bommai",
    "Indra Sawhney",
    "Golaknath", "Golak Nath",
    "ADM Jabalpur",
    "Minerva Mills",
]
_JUDGMENT_RE = re.compile(r'\b(' + '|'.join(re.escape(j) for j in sorted(_JUDGMENT_NAMES, key=len, reverse=True)) + r')\b', re.IGNORECASE)

_YEAR_RE = re.compile(r'\b(19[4-9]\d|20\d{2})\b')

_VAGUE_PATTERNS = re.compile(
    r'^(compare\s+both|explain\s+(this|it|them)|summarize?\s+(this|it)|'
    r'what\s+(about|are)\s+(its?|their)\s+\w+|which\s+one|'
    r'how\s+is\s+it\s+different|what\s+does\s+it\s+say|'
    r'tell\s+me\s+more|and\s+(the\s+other|what\s+about)|'
    r'differences?\s+between\s+(them|both)|similarities?\s+between\s+(them|both))$',
    re.IGNORECASE
)


@dataclass
class Turn:
    role: str
    content: str


@dataclass
class LegalEntities:
    articles: list[str] = field(default_factory=list)
    sections: list[str] = field(default_factory=list)
    parts: list[str] = field(default_factory=list)
    chapters: list[str] = field(default_factory=list)
    schedules: list[str] = field(default_factory=list)
    acts: list[str] = field(default_factory=list)
    judgments: list[str] = field(default_factory=list)
    years: list[str] = field(default_factory=list)

    def is_empty(self) -> bool:
        return not any([
            self.articles, self.sections, self.parts,
            self.chapters, self.schedules, self.acts, self.judgments, self.years
        ])

    def all_references(self) -> list[str]:
        refs: list[str] = []
        for art in self.articles:
            refs.append(f"Article {art}")
        for sec in self.sections:
            refs.append(f"Section {sec}")
        for part in self.parts:
            refs.append(f"Part {part}")
        for chap in self.chapters:
            refs.append(f"Chapter {chap}")
        for sched in self.schedules:
            refs.append(sched if 'Schedule' in sched else f"Schedule {sched}")
        refs.extend(self.acts)
        refs.extend(self.judgments)
        refs.extend(self.years)
        return refs


class ConversationMemory:
    """
    Stores turn history and tracks last discussed act and last discussed judgment.
    """

    def __init__(self, max_turns: int = 6, max_context_chars: int = 2000) -> None:
        self._turns: list[Turn] = []
        self.max_turns = max_turns
        self.max_context_chars = max_context_chars
        self.last_discussed_act: Optional[str] = None
        self.last_discussed_judgment: Optional[str] = None

    def __len__(self) -> int:
        return len(self._turns)

    def add(self, role: str, content: str) -> None:
        if role not in ("user", "assistant"):
            return
        content_clean = content.strip()
        self._turns.append(Turn(role=role, content=content_clean))
        while len(self._turns) > self.max_turns:
            self._turns.pop(0)

        # Update last discussed entities
        entities = self.extract_entities(content_clean)
        if entities.acts:
            self.last_discussed_act = entities.acts[-1]
        if entities.judgments:
            self.last_discussed_judgment = entities.judgments[-1]

    def clear(self) -> None:
        self._turns.clear()
        self.last_discussed_act = None
        self.last_discussed_judgment = None

    def get_recent_history(self) -> list[Turn]:
        return list(self._turns)

    def get_context_string(self) -> str:
        lines: list[str] = []
        for turn in self._turns:
            role_label = turn.role.capitalize()
            lines.append(f"{role_label}: {turn.content}")
        raw = "\n".join(lines)
        if len(raw) > self.max_context_chars:
            raw = "...[earlier context truncated]...\n" + raw[-self.max_context_chars:]
        return raw

    def extract_entities(self, text: Optional[str] = None) -> LegalEntities:
        source = text if text is not None else self.get_context_string()

        articles = [m.group(1) or m.group(2) for m in _ARTICLE_RE.finditer(source) if (m.group(1) or m.group(2))]
        sections = [m.group(1) for m in _SECTION_RE.finditer(source) if m.group(1)]
        parts = [m.group(1) for m in _PART_RE.finditer(source) if m.group(1)]
        chapters = [m.group(1) for m in _CHAPTER_RE.finditer(source) if m.group(1)]
        schedules = [(m.group(1) or m.group(0)).strip() for m in _SCHEDULE_RE.finditer(source)]
        acts = [m.group(1) for m in _ACT_RE.finditer(source) if m.group(1)]
        judgments = [m.group(1) for m in _JUDGMENT_RE.finditer(source) if m.group(1)]
        years = [m.group(1) for m in _YEAR_RE.finditer(source) if m.group(1)]

        return LegalEntities(
            articles=list(dict.fromkeys([a.upper() for a in articles])),
            sections=list(dict.fromkeys([s.upper() for s in sections])),
            parts=list(dict.fromkeys([p.upper() for p in parts])),
            chapters=list(dict.fromkeys([c.upper() for c in chapters])),
            schedules=list(dict.fromkeys(schedules)),
            acts=list(dict.fromkeys(acts)),
            judgments=list(dict.fromkeys(judgments)),
            years=list(dict.fromkeys(years)),
        )

    def is_vague(self, query: str) -> bool:
        q = query.strip()
        current_entities = self.extract_entities(q)
        if not current_entities.is_empty():
            return False
        return bool(_VAGUE_PATTERNS.search(q))

    def resolve_reference(self, current_query: str) -> str:
        q = current_query.strip()
        current_entities = self.extract_entities(q)
        if not current_entities.is_empty():
            return q

        history_entities = self.extract_entities()
        if history_entities.is_empty():
            return q

        refs = history_entities.all_references()
        if refs:
            expanded = f"{q} (regarding {' and '.join(refs)})"
            return expanded
        return q


def memory_from_history(history: list[dict[str, str]], max_turns: int = 6) -> ConversationMemory:
    mem = ConversationMemory(max_turns=max_turns)
    if not history:
        return mem

    for item in history:
        if isinstance(item, dict):
            role = item.get("role", "")
            content = item.get("content", "")
            if role in ("user", "assistant") and content:
                mem.add(role, content)
    return mem
