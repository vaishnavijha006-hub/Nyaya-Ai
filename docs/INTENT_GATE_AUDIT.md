# Nyaya AI Intent Gating & Hallucination Audit Report

## 1. Root Cause Analysis

When a user submitted casual inputs such as `"hii"`, `"hello"`, or `"good morning"`, the legacy orchestration pipeline failed to gate the incoming request prior to legal module execution. 

Specifically:
- `intent_classifier.py` lacked explicit `CASUAL_CHAT` and `INSUFFICIENT_CONTEXT` intent categories.
- `chat.py` allowed casual messages to bypass direct routing and fall through to Stage 1 case intake (`STAGE_GATHER_DETAILS`).
- Stage 1 intake executed ChromaDB vector search (`retrieve("hii", k=6)`) and legal analysis (`run_legal_analysis`).
- Because vector distance returns nearest embeddings regardless of query context, ChromaDB returned arbitrary statutory chunks (such as Bharatiya Sakshya Adhiniyam Section 1 and *K.S. Puttaswamy* privacy precedent).
- `_build_grounded_fallback_analysis` formatted these random chunks into an authoritative statutory legal answer for `"hii"`.
- The frontend UI displayed a hardcoded `"VERIFIED"` badge and rendered a "Case Created & Information Saved" banner for casual greetings.

---

## 2. Execution Path Comparison

### Legacy Execution Path (Flawed)
```
User message ("hii")
  └─► intent_classifier.py (returned GREETING or UNKNOWN)
        └─► chat.py (bypassed direct routing check)
              └─► STAGE_GATHER_DETAILS (mutated session state in journey_state.py)
                    └─► run_legal_analysis("hii")
                          └─► ChromaDB retrieve("hii") -> Section 1 BSA, Puttaswamy
                                └─► _build_grounded_fallback_analysis -> Fabricated Legal Card
                                      └─► UI renders "VERIFIED" badge & Case Created banner
```

### New Hard-Gated Architecture (Fixed)
```
User message ("hii")
  └─► intent_classifier.py (classifies as CASUAL_CHAT)
        └─► chat.py Hard Intent Gate (is_legal_intent(intent) == False)
              ├─► Enforces Hard Invariants:
              │     - legal_analysis = None
              │     - legal_sources = []
              │     - applicable_laws = []
              │     - precedents = []
              │     - pathway = None
              │     - triage_score = None
              │     - settlement_score = None
              │     - verification_status = "CASUAL"
              ├─► State Protection: journey_state.py is UNTOUCHED
              ├─► RAG Retrieval: Bypassed completely (0 vector queries)
              └─► SSE Stream / Response: Emits friendly conversational text token + done ONLY
```

---

## 3. Intent Taxonomy & Gating Matrix

| Intent Category | Description | Legal Engine Triggered? | Vector Search Run? | State Mutated? | Response Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CASUAL_CHAT` | Greetings, pleasantries, small talk (`"hii"`, `"hello"`, `"good morning"`, `"thanks"`, `"okay"`, `"what's up"`) | ❌ No | ❌ No | ❌ No | `CASUAL` |
| `INSUFFICIENT_CONTEXT` | Ambiguous single keywords (`"help"`, `"rent"`, `"police"`, `"court"`, `"money"`) | ❌ No | ❌ No | ❌ No | `ADVISORY` |
| `GENERAL_LEGAL_QUERY` | Direct questions on law/sections without personal facts (`"What is Section 138?"`) | ✅ Yes | ✅ Yes | ❌ No | `GROUNDED` / `GENERATED` |
| `DOCUMENT_QUERY` | Drafting requests or required document queries | ✅ Yes | ❌ No | ❌ No | `GENERATED` |
| `PROCEDURAL_QUERY` | How-to questions for RTI, FIR, legal complaints | ✅ Yes | ✅ Yes | ❌ No | `GROUNDED` |
| `EMERGENCY_LEGAL_PROBLEM` | Immediate danger, physical threat, abuse | ⚠️ Emergency UI | ❌ No | ⚠️ Emergency | `EMERGENCY` |
| `PERSONAL_LEGAL_PROBLEM` | Dispute involving specific personal facts & damages | ✅ Yes | ✅ Yes | ✅ Yes | `VERIFIED` / `GROUNDED` |

---

## 4. Invariant Enforcement & State Protection

1. **State Protection**:
   - `journey_state.py` is protected from mutation during `CASUAL_CHAT` and `INSUFFICIENT_CONTEXT` requests. No case profile, facts, or journey stages are initialized or advanced.
2. **Short & Ambiguous Clarification**:
   - Single ambiguous inputs (such as `"rent"` or `"police"`) elicit polite clarification prompts rather than fabricated legal claims.
3. **Verification Status Badge Rules**:
   - The hardcoded `"VERIFIED"` badge has been removed.
   - Responses report explicit status (`CASUAL`, `GENERATED`, `GROUNDED`, `VERIFIED`, `ADVISORY`).
   - `"VERIFIED"` is displayed **only** when formal document or source verification is complete.
4. **Conditional Case Banner**:
   - The "✓ Case Created & Information Saved" banner in `app/chat/page.tsx` renders only when an active personal case journey stage exists.

---

## 5. Test Verification Summary

1. **Backend Intent Gate Regression Suite (`test_intent_gate_regression.py`)**:
   - Tests `"hii"`, `"hello"`, `"good morning"`, `"thanks"`, `"okay"`, `"what's up"` -> `CASUAL_CHAT`, 0 retrieval, no laws.
   - Tests `"help"`, `"rent"`, `"police"`, `"court"`, `"money"` -> `INSUFFICIENT_CONTEXT`, clarification prompt.
   - Tests `"What is Section 138 of the Negotiable Instruments Act?"` -> `GENERAL_LEGAL_QUERY`.
   - Tests `"My landlord locked me out and won't return my ₹50,000 deposit."` -> `PERSONAL_LEGAL_PROBLEM`.
   - **Result**: `ALL INTENT GATE REGRESSION TESTS PASSED SUCCESSFULLY!`.

2. **Playwright E2E Suite (`tests/intent-gating.spec.ts`)**:
   - Verifies `"hii"` produces clean greeting without Legal Analysis cards or Verified badges.
   - Verifies personal dispute starts full case intake journey.

3. **TypeScript Type Check**:
   - Command: `npx tsc --noEmit`
   - **Result**: `Exit code 0` (Zero type errors).

---

## 6. Remaining Risks & Safeguards

- **Multi-Sentence Mixed Queries**: If a user combines greetings and complex dispute facts (e.g. `"Hello, my landlord locked me out"`), the classifier accurately categorizes the message as `PERSONAL_LEGAL_PROBLEM` based on personal pronouns and conflict keywords, triggering intake as intended.
- **LLM Rate-Limit Fallback**: The deterministic `_heuristic_classify_intent` handles rate-limiting scenarios cleanly without leaking legal analysis to casual greetings.
