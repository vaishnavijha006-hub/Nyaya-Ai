"""
test_parser.py — Dedicated Unit Test Suite for Legal Reference Parser (Task 4).
Uses Python built-in unittest framework.
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.rag.parser import parse_legal_references, is_legal_heading_start


class TestLegalParser(unittest.TestCase):

    def test_article_variations(self):
        cases = [
            ("ARTICLE 19", "19", "ARTICLE"),
            ("Article 19", "19", "ARTICLE"),
            ("Art. 19", "19", "ART_SHORT"),
            ("Arts. 18-19", "18", "ARTS_RANGE"),
            ("ARTICLE 300A", "300A", "ARTICLE"),
            ("ARTICLE 32A", "32A", "ARTICLE"),
            ("ARTICLE 21A", "21A", "ARTICLE"),
            ("ARTICLE 239AA", "239AA", "ARTICLE"),
            ("51A. It shall be the duty of every citizen", "51A", "STANDALONE_ARTICLE"),
        ]
        for text, expected_art, expected_type in cases:
            res = parse_legal_references(text)
            self.assertEqual(res["article"], expected_art, f"Failed article parsing for '{text}'")
            self.assertEqual(res["heading_type"], expected_type, f"Failed heading_type for '{text}'")

    def test_section_variations(self):
        cases = [
            ("Section 3", "3", "SECTION"),
            ("SECTION 138", "138", "SECTION"),
            ("Sec. 3", "3", "SEC_SHORT"),
            ("Secs. 3-5", "3", "SECS_RANGE"),
        ]
        for text, expected_sec, expected_type in cases:
            res = parse_legal_references(text)
            self.assertEqual(res["section"], expected_sec, f"Failed section parsing for '{text}'")
            self.assertEqual(res["heading_type"], expected_type, f"Failed heading_type for '{text}'")

    def test_part_and_chapter(self):
        res_part = parse_legal_references("Part IVA FUNDAMENTAL DUTIES")
        self.assertEqual(res_part["part"], "IVA")

        res_chap = parse_legal_references("CHAPTER II THE EXECUTIVE")
        self.assertEqual(res_chap["chapter"], "II")

    def test_ordinary_numbered_lists_ignored(self):
        ordinary_lists = [
            "(1) No person shall be deprived...",
            "(a) to abide by the Constitution...",
            "(i) any jagir, inam or muafi...",
        ]
        for text in ordinary_lists:
            res = parse_legal_references(text)
            self.assertIsNone(res["article"], f"Ordinary list falsely parsed as article: '{text}'")
            self.assertIsNone(res["section"], f"Ordinary list falsely parsed as section: '{text}'")
            self.assertFalse(is_legal_heading_start(text), f"is_legal_heading_start falsely returned True for '{text}'")


if __name__ == "__main__":
    unittest.main()
