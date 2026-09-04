# Nyaya AI — PPT Feature Master List

**Source Document**: `Nyaya_AI_TechChaos.pptx` (Team Tech Chaos — Sapna Jha & Vaishnavi)  
**Extraction Date**: September 4, 2026  
**Purpose**: Comprehensive master list of all product, technical, engine, workflow, security, business model, and testing claims extracted from the PPT slides.

---

## 1. Product & Core Workflow Claims (Slide 3)

1. **Conversational Intake (Understand)**:
   - Distinguishes question type (general legal query vs personal dispute).
   - Conversational factual intake gathering key dates, parties, claims, and damages.
2. **Document Verification (Verify)**:
   - Cross-checks uploaded documents against stated facts.
   - Identifies discrepancies, missing scans, or evidence gaps.
3. **Section 12 Legal Aid Check (Check Eligibility)**:
   - Evaluates eligibility under Section 12 of Legal Services Authorities Act, 1987.
   - Matches applicant to nearest District Legal Services Authority (DLSA) office with required document checklist.
4. **Triage & Readiness Scoring (Triage)**:
   - Computes Dispute Readiness & Settlement Score.
   - Recommends file now, fix defects first, or attempt mediation.
5. **Connect & Routing (Connect)**:
   - Routes user to DLSA office, empanelled pro-bono advocate, or Lok Adalat/mediation.
6. **Judicial Case Packaging & Delay Tracking (Act)**:
   - Produces a 9-section judge-ready case package dossier with delay tracking metrics.

---

## 2. Core Innovation & Differentiation Claims (Slide 4 & 5)

7. **Two-Sided Pre-Litigation Portal**:
   - Generates real response link for the opposite party.
   - Builds a confidential settlement dossier.
   - Auto-escalates to Lok Adalat/court if no response is received.
   - Logs non-response neutrally without fault assignment.
   - Protects talks under "without prejudice" confidentiality (Mediation Act, 2023).
8. **Dispute Readiness & Settlement Score**:
   - Actively changes user pathway based on case completeness and statutory parameters.
   - Advisory score with hard-coded limitation-period override near deadlines (Limitation Act, 1963).
   - Mandatory advocate review disclaimer (NALSA Tele-Law model).
9. **Adjournment & Delay Intelligence**:
   - Quantifies cumulative case delay across hearings.
   - Estimates financial and time cost of the next adjournment.
   - Two-tier pipeline: NJDG/eCourts data integration for digitised courts, with user-reported fallback elsewhere.
10. **Cluster Case Filing & Systemic Fix**:
    - Detects patterns across multiple individual complaints against a common counterparty.
    - Multi-factor match algorithm (entity + incident window + issue category).
    - Mandatory human confirmation (zero auto-enrollment).
    - Converts clusters into collective filings, PIL outlines, and regulator hotspot dashboards.
    - Routes PIL matters to empanelled advocates via DLSA/NALSA (never self-filed).

---

## 3. Technical Implementation & Architecture Claims (Slide 7)

11. **Frontend Architecture**:
    - Next.js / React framework.
    - Server-Sent Events (SSE) streaming for live AI responses.
12. **Backend Architecture**:
    - FastAPI orchestration server.
    - Multi-tenant session isolation engine (`journey_state.py`).
    - 9-Pathway Routing Engine (`pathway_router.py`).
13. **Dedicated Engines**:
    - Triage engine.
    - Case packaging engine.
    - Cluster detection engine (Qdrant vector similarity with PII scrubbing).
    - Systemic action engine.
    - PIL outline engine.
    - Settlement notice engine.
    - ADR / Mediation engine.
    - Delay tracking engine.
    - Enhanced legal-aid matching engine.
14. **Document Generation**:
    - Print-ready PDF output for RTI applications, legal notices, and agreements.
15. **Testing & Quality Claims**:
    - 54/54 pytest unit/integration test cases passed.
    - 6/6 Playwright end-to-end browser tests passed.
    - Clean TypeScript compilation with 0 build errors.

---

## 4. Scalability & Business Model Claims (Slide 8)

16. **Modular Microservice Architecture**:
    - Independent engine scaling per state or DLSA.
17. **Multi-Tenant Architecture**:
    - User/tenant session isolation separating individual data.
18. **High-Volume Vector Search**:
    - Semantic similarity matching over large complaint databases via Qdrant.
19. **Monetization & Dashboard Tiers**:
    - B2C Citizen Free & Pro tiers; B2B Advocate & DLSA Hotspot Dashboards.

---

## 5. Future Roadmap Claims (Slide 9)

20. **Phase 1 (0–3 Months)**: DLSA pilot validation.
21. **Phase 2 (3–9 Months)**: Multi-state rollout & pro-bono advocate onboarding.
22. **Phase 3 (9–18 Months)**: General availability & regulator dashboards.
23. **Phase 4 (18+ Months)**: Ekjut legal-access OS integration.
