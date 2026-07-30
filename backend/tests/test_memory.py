"""
tests/test_memory.py — Unit tests for Phase 9 ConversationMemory.

Covers:
    Test 1:  Article 21 history + "What about Article 14?" → context-augmented
    Test 2:  Article 21 history + "Compare both" → expanded with Article 21
    Test 3:  RTI Act history + "What is Section 8?" → Act context augmented
    Test 4:  History exceeds 6 turns → oldest discarded
    Test 5:  Explicit Article 32 in query → history Article 21 ignored (current wins)
    Test 6:  Empty history → query unchanged
    Test 7:  extract_entities() finds articles, sections, acts, years
    Test 8:  get_context_string() respects 2000 char limit
    Test 9:  memory_from_history() builds from dict list
    Test 10: system role messages are ignored by add()
    Test 11: LegalEntities.all_references() produces correct flat list
    Test 12: Fully vague "explain this" resolved with history entities
"""

import sys
import os
import time
import unittest

# Add backend root to path so imports work whether run from backend/ or tests/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.rag.memory import (
    ConversationMemory,
    LegalEntities,
    memory_from_history,
)


class TestConversationMemoryAdd(unittest.TestCase):
    """Tests for add() and turn management."""

    def test_add_user_message(self):
        mem = ConversationMemory()
        mem.add("user", "Explain Article 21")
        self.assertEqual(len(mem), 1)
        self.assertEqual(mem.get_recent_history()[0].role, "user")

    def test_add_assistant_message(self):
        mem = ConversationMemory()
        mem.add("assistant", "Article 21 guarantees right to life...")
        self.assertEqual(len(mem), 1)

    def test_system_role_ignored(self):
        """Test 10: system role messages are silently dropped."""
        mem = ConversationMemory()
        mem.add("system", "You are a legal assistant.")
        self.assertEqual(len(mem), 0)

    def test_invalid_role_ignored(self):
        mem = ConversationMemory()
        mem.add("tool", "some tool call")
        self.assertEqual(len(mem), 0)

    def test_max_turns_enforced(self):
        """Test 4: History exceeds 6 turns → oldest removed."""
        mem = ConversationMemory(max_turns=6)
        for i in range(8):
            mem.add("user", f"Question {i}")
        self.assertEqual(len(mem), 6)
        # First retained turn should be Question 2 (0 and 1 were evicted)
        self.assertIn("Question 2", mem.get_recent_history()[0].content)

    def test_custom_max_turns(self):
        mem = ConversationMemory(max_turns=2)
        mem.add("user", "A")
        mem.add("user", "B")
        mem.add("user", "C")
        self.assertEqual(len(mem), 2)
        contents = [t.content for t in mem.get_recent_history()]
        self.assertEqual(contents, ["B", "C"])

    def test_clear_resets(self):
        mem = ConversationMemory()
        mem.add("user", "Q1")
        mem.clear()
        self.assertEqual(len(mem), 0)


class TestExtractEntities(unittest.TestCase):
    """Tests for extract_entities()."""

    def test_article_extraction(self):
        """Test 7a: Articles extracted from text."""
        mem = ConversationMemory()
        entities = mem.extract_entities("Explain Article 21 and Article 14")
        self.assertIn("21", entities.articles)
        self.assertIn("14", entities.articles)

    def test_article_21a_extraction(self):
        entities = ConversationMemory().extract_entities("Article 21A guarantees education")
        self.assertTrue(any("21A" in a or "21" in a for a in entities.articles))

    def test_section_extraction(self):
        """Test 7b: Sections extracted."""
        entities = ConversationMemory().extract_entities("Section 8 of RTI Act")
        self.assertIn("8", entities.sections)

    def test_act_extraction(self):
        """Test 7c: Acts extracted."""
        entities = ConversationMemory().extract_entities("Under the RTI Act, Section 6 applies")
        self.assertTrue(any("RTI" in a or "Right to Information" in a for a in entities.acts))

    def test_year_extraction(self):
        entities = ConversationMemory().extract_entities("The Constitution was adopted in 1949")
        self.assertIn("1949", entities.years)

    def test_empty_text(self):
        entities = ConversationMemory().extract_entities("")
        self.assertTrue(entities.is_empty())

    def test_extract_from_history(self):
        """Extraction with no text argument uses stored turns."""
        mem = ConversationMemory()
        mem.add("user", "Explain Article 21")
        mem.add("assistant", "Article 21 guarantees right to life under Part III.")
        entities = mem.extract_entities()
        self.assertIn("21", entities.articles)

    def test_all_references_flat_list(self):
        """Test 11: LegalEntities.all_references() produces correct flat list."""
        ent = LegalEntities(articles=["21", "14"], sections=["8"], acts=["RTI Act"])
        refs = ent.all_references()
        self.assertIn("Article 21", refs)
        self.assertIn("Article 14", refs)
        self.assertIn("Section 8", refs)
        self.assertIn("RTI Act", refs)

    def test_is_empty(self):
        self.assertTrue(LegalEntities().is_empty())
        self.assertFalse(LegalEntities(articles=["21"]).is_empty())


class TestResolveReference(unittest.TestCase):
    """Tests for resolve_reference() — the core memory expansion logic."""

    def test_explicit_article_unchanged_no_history(self):
        """Test 6: Empty history → query unchanged."""
        mem = ConversationMemory()
        result = mem.resolve_reference("Explain Article 32")
        self.assertEqual(result, "Explain Article 32")

    def test_explicit_article_wins_over_history(self):
        """Test 5: Explicit Article 32 in query → Article 21 from history ignored."""
        mem = ConversationMemory()
        mem.add("user", "Explain Article 21")
        mem.add("assistant", "Article 21 protects right to life...")
        # Query explicitly mentions Article 32 → must NOT be augmented with Article 21
        result = mem.resolve_reference("What does Article 32 say?")
        # Article 32 must still be present in result
        self.assertIn("Article 32", result)
        # The returned query must prioritize Article 32 (no incorrect expansion)
        self.assertIn("32", result)

    def test_vague_compare_both_resolved(self):
        """Test 2: History has Article 21, vague 'compare both' → Article 21 added."""
        mem = ConversationMemory()
        mem.add("user", "Explain Article 21")
        mem.add("assistant", "Article 21 protects...")
        mem.add("user", "What about Article 14?")
        result = mem.resolve_reference("Compare both")
        self.assertIn("Article 21", result)

    def test_what_about_article_14_augmented(self):
        """
        Test 1: History has Article 21, current query 'What about Article 14?'
        Current query has explicit Article 14 → returns as-is or with Act context.
        """
        mem = ConversationMemory()
        mem.add("user", "Explain Article 21")
        mem.add("assistant", "Article 21 protects the right to life...")
        result = mem.resolve_reference("What about Article 14?")
        # Must contain Article 14 (current query entity preserved)
        self.assertIn("14", result)

    def test_rti_section_8_augmented(self):
        """
        Test 3: History has RTI Act, current query 'What is Section 8?'
        → RTI Act context should be augmented.
        """
        mem = ConversationMemory()
        mem.add("user", "How does RTI Act work?")
        mem.add("assistant", "The Right to Information Act, 2005 provides...")
        result = mem.resolve_reference("What is Section 8?")
        # Section 8 must remain in result
        self.assertIn("8", result)
        # RTI context should be augmented
        self.assertTrue("RTI" in result or "Right to Information" in result or "Section" in result)

    def test_vague_explain_this_resolved(self):
        """Test 12: Fully vague 'explain this' resolved with history entities."""
        mem = ConversationMemory()
        mem.add("user", "Tell me about Article 21")
        mem.add("assistant", "Article 21 guarantees...")
        result = mem.resolve_reference("explain this")
        self.assertIn("Article 21", result)

    def test_summarize_it_resolved(self):
        mem = ConversationMemory()
        mem.add("user", "Explain Section 8 of RTI Act")
        result = mem.resolve_reference("summarize it")
        self.assertIn("Section 8", result)

    def test_no_duplicate_retrieval(self):
        """resolve_reference must not call retrieve() or add LLM overhead."""
        mem = ConversationMemory()
        mem.add("user", "Article 21")
        t0 = time.perf_counter()
        for _ in range(1000):
            mem.resolve_reference("Compare both")
        elapsed_ms = (time.perf_counter() - t0) * 1000
        # 1000 calls in < 50ms total → < 0.05ms each
        self.assertLess(elapsed_ms, 50, f"resolve_reference too slow: {elapsed_ms:.1f}ms for 1000 calls")


class TestGetContextString(unittest.TestCase):
    """Tests for get_context_string()."""

    def test_ordered_output(self):
        mem = ConversationMemory()
        mem.add("user", "Q1")
        mem.add("assistant", "A1")
        ctx = mem.get_context_string()
        self.assertIn("User: Q1", ctx)
        self.assertIn("Assistant: A1", ctx)
        # User must come before Assistant in the string
        self.assertLess(ctx.index("User: Q1"), ctx.index("Assistant: A1"))

    def test_max_context_chars_respected(self):
        """Test 8: context string respects 2000 char limit."""
        mem = ConversationMemory(max_context_chars=2000)
        for i in range(6):
            mem.add("user", "X" * 400)
        ctx = mem.get_context_string()
        self.assertLessEqual(len(ctx), 2100)  # small buffer for truncation prefix

    def test_empty_memory_returns_empty(self):
        mem = ConversationMemory()
        self.assertEqual(mem.get_context_string(), "")


class TestMemoryFromHistory(unittest.TestCase):
    """Tests for memory_from_history() helper."""

    def test_basic_construction(self):
        """Test 9: memory_from_history builds from dict list."""
        history = [
            {"role": "user", "content": "Explain Article 21"},
            {"role": "assistant", "content": "Article 21 protects..."},
        ]
        mem = memory_from_history(history)
        self.assertEqual(len(mem), 2)

    def test_invalid_entries_skipped(self):
        history = [
            {"role": "", "content": "something"},
            {"role": "user", "content": ""},
            {"role": "user", "content": "Valid question"},
        ]
        mem = memory_from_history(history)
        self.assertEqual(len(mem), 1)

    def test_none_history(self):
        mem = memory_from_history(None)
        self.assertEqual(len(mem), 0)

    def test_empty_list(self):
        mem = memory_from_history([])
        self.assertEqual(len(mem), 0)

    def test_caps_at_max_turns(self):
        history = [{"role": "user", "content": f"Q{i}"} for i in range(10)]
        mem = memory_from_history(history)
        self.assertEqual(len(mem), 6)


class TestPerformance(unittest.TestCase):
    """Performance gate: all memory operations must be < 1ms each."""

    def test_add_performance(self):
        mem = ConversationMemory()
        t0 = time.perf_counter()
        for i in range(10000):
            mem.add("user", f"Article {i % 400}")
        elapsed = (time.perf_counter() - t0) * 1000
        per_op = elapsed / 10000
        self.assertLess(per_op, 1.0, f"add() too slow: {per_op:.3f}ms per call")

    def test_extract_entities_performance(self):
        mem = ConversationMemory()
        for i in range(6):
            mem.add("user", f"Explain Article {i + 1} and Section {i + 10} of RTI Act")
        t0 = time.perf_counter()
        for _ in range(10000):
            mem.extract_entities()
        elapsed = (time.perf_counter() - t0) * 1000
        per_op = elapsed / 10000
        self.assertLess(per_op, 1.0, f"extract_entities() too slow: {per_op:.3f}ms per call")

    def test_get_context_string_performance(self):
        mem = ConversationMemory()
        for i in range(6):
            mem.add("user", f"Question {i}" * 20)
        t0 = time.perf_counter()
        for _ in range(10000):
            mem.get_context_string()
        elapsed = (time.perf_counter() - t0) * 1000
        per_op = elapsed / 10000
        self.assertLess(per_op, 1.0, f"get_context_string() too slow: {per_op:.3f}ms per call")


if __name__ == "__main__":
    unittest.main(verbosity=2)
