"""
loader.py — Column-aware PDF loader for the Constitution of India.
"""

import re
from pathlib import Path
from typing import Optional

import pdfplumber
from langchain_core.documents import Document

PAGE_WIDTH       = 360
PAGE_HEIGHT      = 594
MARGIN_X_CUTOFF  = 90
HEADER_HEIGHT    = 50
FOOTER_HEIGHT    = 50

# Match "21." or "21A."
_ARTICLE_NUM_RE = re.compile(r'^\*{0,2}\[?(\d{1,3}[A-Z]?)\.\s')

def _crop_columns(page: pdfplumber.page.Page):
    x0, top, x1, bottom = page.bbox
    content_top    = top    + HEADER_HEIGHT
    content_bottom = bottom - FOOTER_HEIGHT

    margin_crop = page.crop((x0,               content_top, MARGIN_X_CUTOFF, content_bottom))
    main_crop   = page.crop((MARGIN_X_CUTOFF,  content_top, x1,              content_bottom))

    # Extract words with their bounding boxes
    margin_words = margin_crop.extract_words()
    main_text   = main_crop.extract_text(x_tolerance=3, y_tolerance=3)   or ""

    return margin_words, main_text.strip()


def _inject_article_labels(main_text: str, margin_words: list) -> tuple:
    lines = main_text.split("\n")
    enriched_lines = []
    article_metadata = []

    for line in lines:
        stripped = line.strip()
        m = _ARTICLE_NUM_RE.match(stripped)
        if m:
            art_num = m.group(1)
            # Find words in margin that are roughly at the same y-level or slightly below
            # Since margin headings can be unreliable, we just prepend the Article Number explicitly
            # and guarantee a double newline before it for the splitter.
            
            label = "ARTICLE " + art_num
            # Ensure there is always a double newline before ARTICLE for clean splitting
            enriched_lines.append("")
            enriched_lines.append("")
            enriched_lines.append(label)
            enriched_lines.append(stripped)
            article_metadata.append({"article_num": art_num, "heading": ""})
        else:
            enriched_lines.append(line)

    return "\n".join(enriched_lines), article_metadata


def load_pdf(path: str) -> list:
    resolved = Path(path).resolve()
    if not resolved.exists():
        raise FileNotFoundError("PDF not found: " + str(resolved))

    source_name = resolved.stem
    documents = []
    errors = 0

    with pdfplumber.open(str(resolved)) as pdf:
        total = len(pdf.pages)
        print("[loader] " + resolved.name + ": " + str(total) + " pages")

        for page_num, page in enumerate(pdf.pages):
            try:
                margin_words, main_text = _crop_columns(page)
            except Exception as exc:
                errors += 1
                try:
                    main_text   = page.extract_text(x_tolerance=3, y_tolerance=3) or ""
                    margin_words = []
                except Exception:
                    main_text, margin_words = "", []

            if not main_text.strip():
                continue

            enriched_text, article_meta = _inject_article_labels(main_text, margin_words)
            article_nums = [m["article_num"] for m in article_meta]

            documents.append(Document(
                page_content=enriched_text,
                metadata={
                    "source":           source_name,
                    "file_path":        str(resolved),
                    "page":             page_num + 1,
                    "articles":         ", ".join(article_nums),
                },
            ))

    if errors > 0:
        print("[loader] " + str(errors) + " pages used fallback extraction")
    print("[loader] Loaded " + str(len(documents)) + " pages")
    return documents