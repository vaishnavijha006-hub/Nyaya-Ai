# Nyaya AI (न्याय AI) — Final Product Experience & Legal Journey Platform

![Production Ready](https://img.shields.io/badge/Production-Ready-brightgreen.svg)
![Phase 12 Complete](https://img.shields.io/badge/Phase%2012-Final%20Product%20Experience-amber)
![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)
![Groq Llama 3.3](https://img.shields.io/badge/AI-Groq%20Llama%203.3%2070B-orange)
![Playwright](https://img.shields.io/badge/Testing-Playwright%20E2E-green)

> **Nyaya AI** is a judge-ready, citizen-first legal journey platform designed for Indian legal resolution.  
> Nyaya AI does not merely answer legal queries — it guides citizens progressively from:  
> **PROBLEM → FACTS → EVIDENCE → LEGAL ANALYSIS → RESOLUTION PATH → ACTION → RESOLUTION**  
> while making pendency-reduction impact visible and avoiding unnecessary court litigation.

---

## 🌟 Problem & Core Innovation

### The Problem
India faces over **50 million pending court cases**. Many legal disputes enter formal court litigation prematurely without adequate evidence organization, clear factual intake, or exploring available pre-litigation resolution alternatives like direct settlement, mediation (ADR), Lok Adalat, or administrative remedies.

### The Nyaya Approach & Core Differentiator
Most legal-tech tools focus on isolated tasks (static Q&A, simple drafting, or advocate search). Nyaya AI unifies 9 core capabilities into one cohesive, guided journey:

1. **Conversational Intake**: Multi-lingual text and voice intake in everyday language.
2. **Fact Extraction & Verification**: Automatic chronological extraction of parties, dates, and claims.
3. **Document Evidence Audit**: Verification of uploaded agreements, receipts, and missing proof detection (`✓ Verified`, `↑ Uploaded`, `! Needs Review`, `○ Missing`).
4. **Layered Legal Analysis**: 5-level structured analysis (Plain-Language Explanation, Possible Issues, Why They Apply, Uncertainties, Relevant Law & Citations).
5. **Pathway Recommendations & Explainability**: Transparent *"Why Nyaya suggests exploring this"* reasoning for Pre-Litigation Settlement, Mediation (ADR), DLSA Legal Aid, or Formal Litigation.
6. **Custom Action Plan**: `DONE`, `CURRENT`, and `UPCOMING` action cards formatted with `WHAT`, `WHY`, and `HOW`.
7. **Judge-Ready Case Package Dossier**: 9-section structured case dossier with complete chronology and evidence matrix.
8. **Delay Intelligence**: Factual tracking of court hearings, recorded adjournments, and time elapsed.
9. **Systemic Pattern Engine**: Anonymized detection of recurring regional dispute clusters to support collective action.

---

## 🛡️ Legal Safety & Trust Principles

- **Informational & Organizational Purpose**: Nyaya AI provides informational guidance. It does not replace a licensed advocate or court.
- **Zero Win Probability Claims**: Case readiness is evaluated qualitatively across categories (Case Info, Evidence, Legal Review, Action Readiness). Nyaya never displays misleading win percentages.
- **Privacy & Zero Public Model Training**: User case facts and uploaded documents are encrypted and never sent for public model training.
- **Mandatory Advocate Review**: Generated Case Package Dossiers explicitly mandate qualified advocate review before court reliance or filing.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion, Radix UI, Lucide Icons.
- **Backend & RAG**: FastAPI (Python 3.10+), ChromaDB, BM25Okapi, BAAI/bge-small-en-v1.5, RRF (Reciprocal Rank Fusion).
- **LLM Provider**: Groq LPU API (`llama-3.3-70b-versatile`).
- **Database & Auth**: Supabase, PostgreSQL, Server-Sent Events (SSE).
- **E2E Testing**: Playwright E2E Test Suite (123+ spec scenarios).

---

## 🚀 Quick Start Guide

### 1. Frontend Setup & Build
```bash
# Install dependencies
npm install

# Run TypeScript typecheck
npm run typecheck

# Run Next.js local development server
npm run dev

# Run production build
npm run build
```
Open `http://localhost:3000` in your browser.

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 🧪 Testing & E2E Validation

```bash
# Run complete Playwright E2E test suite
npx playwright test

# Run backend Pytest suite
cd backend
pytest
```

---

## 🎬 Demo Mode & Evaluator Guide

For hackathon judges, mentors, and reviewers, Nyaya AI includes an **Interactive Demo Mode**:

- **Demo Route**: Access `http://localhost:3000/demo`
- **Demo Guide Document**: See [`docs/DEMO_GUIDE.md`](file:///c:/Users/sapna%20jha/Downloads/Nyaya-AI/Nyaya-Ai/docs/DEMO_GUIDE.md) for a detailed 5-7 minute presentation script.
- **Sample Cases**: Pre-loaded with realistic Indian legal disputes (Tenant-Landlord Deposit Dispute, Employment Salary & Severance Recovery). All demo data is strictly isolated with `"Demo Case — Illustrative data only"`.

---

## 📜 Known Limitations

- Nyaya AI is an informational decision-support system. It does not issue binding legal decrees or execute direct court submissions without human advocate intervention.
- Automated document OCR accuracy is subject to scan resolution and image quality.

---

## 📄 License
This project is licensed under the MIT License.
