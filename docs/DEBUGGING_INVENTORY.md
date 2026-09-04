# Nyaya AI — Complete Architecture & Debugging Inventory

**System Name**: Nyaya AI (Legal Tech Platform for Citizen Empowerment & Delay Reduction)  
**Version**: 1.0.0 (Production Hardened)  
**Date**: September 4, 2026  
**Status**: VERIFIED & AUDITED  

---

## 1. System Architecture Overview

Nyaya AI operates a dual-tier architecture combining a modern Next.js frontend with a specialized Python FastAPI intelligence backend and Supabase cloud database/storage infrastructure.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           NYAYA AI FRONTEND                             │
│                      (Next.js 13.5 + React 18 + Tailwind)              │
│                                                                         │
│  • Public Intake & Search     • NyayaPath Guided Resolution Engine     │
│  • 5 Citizen Questions UI     • Interactive Action Plan & Case Package  │
│  • Settlement & Legal Aid     • Trust, Grounding & Audit Trail Controls │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
┌────────────────────────────────┐     ┌──────────────────────────────────┐
│     SUPABASE INFRASTRUCTURE    │     │      PYTHON FASTAPI BACKEND      │
│                                │     │           (Port 8000)            │
│  • PostgreSQL DB with RLS      │     │                                  │
│  • Row-Level Authorization     │     │  • RAG & Legal Retrieval Engine  │
│  • Document Storage Buckets    │     │  • SSE Streaming /chat/stream    │
│  • Auth Sessions & Identity    │     │  • Dispute Classification & PIL  │
└────────────────────────────────┘     └──────────────────────────────────┘
```

---

## 2. Environment & Configuration Audit

- **Frontend Tech Stack**: Next.js 13.5.11, React 18.2.0, Tailwind CSS 3.3.3, Lucide Icons, Framer Motion, Radix UI.
- **Backend Tech Stack**: Python 3.10+, FastAPI, Uvicorn, LangChain / LlamaIndex / Qdrant Integration, Pydantic, PyPDF2.
- **Database & Security**: Supabase PostgreSQL with strict Row Level Security (RLS) policies for multi-tenant data isolation.
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_API_URL` (`http://127.0.0.1:8000`)
  - `OPENAI_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`

---

## 3. Discovered Application Routes & Capabilities

### Public & Intake Routes
1. `/` — Home Landing Page with zero-onboarding problem intake, category shortcuts, emergency safety triggers, and mobile drawer navigation.
2. `/chat` — Interactive Ask Nyaya AI intake chat supporting real-time streaming (SSE), follow-up questions, and fact extraction.
3. `/demo` — NyayaPath Guided Legal Resolution Journey walkthrough across all 6 resolution stages.
4. `/trust` — AI Transparency, Statutory Grounding & Legal Safety Disclaimer Center.
5. `/auth` & `/signup` — Zero-Trust authentication and session management.

### Case Command Center & Workspace Routes
6. `/cases` — Multi-tenant case dashboard listing active disputes, status badges, and active stage trackers.
7. `/cases/[caseId]` — Case Command Center answering 5 Citizen Questions:
   - What Happened? (Facts & Chronology)
   - What Does Nyaya Understand? (Dispute Classification)
   - What Evidence Do I Have? (Document Matrix & Readiness)
   - What Legal Issues Apply? (Statutory Provisions & Explainability)
   - What Should I Do Next? (Interactive Action Plan)
8. `/cases/[caseId]/documents` — Document Upload, Validation & Qualitative Readiness Assessment.
9. `/cases/[caseId]/settlement` — Out-of-Court Settlement Proposal notice generator and PDF dossier exporter.
10. `/cases/[caseId]/legal-aid` — Government Legal Aid (DLSA/NALSA) eligibility assessment under Section 12 criteria.
11. `/cases/[caseId]/adr` — Pre-litigation Lok Adalat & ADR mediation routing.
12. `/cases/[caseId]/case-package` — 9-Section Judge-Ready Case Package Dossier generator.
13. `/workspace` — Protected user workspace with strict auth redirection.

### Special Intelligence & Administrative Modules
14. `/intelligence` & `/intelligence/[patternId]` — Systemic Pattern Discovery & PIL Suitability engine.
15. `/collective-actions` — Community dispute clustering and representative litigation matcher.
16. `/contracts` — AI Lease & Rental Agreement Scanner with clause risk scoring.
17. `/fir` — Police Complaint & FIR Guidance module under Bharatiya Nagarik Suraksha Sanhita (BNSS).
18. `/rti` — Right to Information (RTI) application draft generator.
19. `/admin/*` — Administrative Governance, Decision Audit, Continuity, and Operation controls.

---

## 4. Discovered Backend API Endpoints (`/backend/app/api`)

- `POST /chat/stream` — SSE Streaming endpoint for RAG-augmented legal conversation.
- `POST /api/case-understanding/analyze` — Fact extraction, missing evidence detection, and risk scoring.
- `POST /api/documents/upload` — Multipart document upload, format validation, and metadata extraction.
- `POST /api/legal-notice/generate` — Pre-litigation legal notice draft generation.
- `GET /api/legal-aid/evaluate` — Section 12 Legal Services Authorities Act statutory eligibility evaluation.
- `POST /api/case-package/generate` — Judge-Ready dossier index and summary compilation.
- `GET /health` & `GET /api/health` — System status check endpoint.

---

## 5. Security & Isolation Architecture

- **Data Privacy**: No cross-tenant data leakage. Database operations enforce `user_id` context filters and Supabase RLS.
- **PII Protection**: Automatic PII masking on pattern discovery and collective action clustering.
- **Legal Boundaries**: Mandatory non-lawyer disclaimers rendered prominently on all advice panels and exported documents.
