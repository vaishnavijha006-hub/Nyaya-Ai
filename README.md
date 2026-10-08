# ⚖️ Nyaya AI (न्याय AI) — Legal Journey & Citizen Empowerment Platform

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)](https://github.com/vaishnavijha006-hub/Nyaya-Ai)
[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014%20App%20Router-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20Python-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Groq Llama 3.3](https://img.shields.io/badge/LLM-Groq%20Llama--3.3--70B-orange)](https://groq.com)
[![ChromaDB](https://img.shields.io/badge/VectorDB-ChromaDB%20%2B%20BM25-purple)](https://www.trychroma.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Nyaya AI** is a citizen-first, judge-ready legal journey platform for Indian legal resolution.  
> It does not merely answer queries — it guides citizens progressively from emotional distress to structured facts, evidence audit, plain-language legal analysis, pre-litigation resolution paths (direct settlement, mediation, legal aid), and advocate-ready case package dossiers.

---

## 📸 Overview & Vision

India faces over **50 million pending court cases**. A massive portion of disputes enter formal court litigation prematurely without adequate factual intake, evidence organization, or exploring fast pre-litigation resolution options like direct legal notices, Lok Adalats, DLSA legal aid, or mediation.

Nyaya AI transforms how ordinary citizens interact with the Indian legal system by turning dense statutes (BNS, BNSS, Consumer Protection Act, Rent Control Acts, Labour Laws) into actionable, empathetic guidance.

---

## ✨ Core Features & Capabilities

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                         Nyaya AI Core Capabilities                      │
  ├───────────────────┬───────────────────────┬─────────────────────────────┤
  │ 🗣️ Intake         │ 🔍 Legal Analysis     │ 📜 Document Generation      │
  │ • Voice & Chat    │ • Grounded RAG Search │ • Legal Notice Generator    │
  │ • Fact Extraction │ • 5-Level Breakdown   │ • RTI Application Drafts    │
  │ • Proof Audit     │ • Citation Cards      │ • Judge-Ready Case Package  │
  └───────────────────┴───────────────────────┴─────────────────────────────┘
```

### 1. 💬 Conversational Intake & Multi-lingual Voice Interface
- **Natural Language Intake**: Citizens describe their problem in plain Hindi, English, or mixed daily language without knowing legal terminology.
- **Voice Input & Speech-to-Text**: Built-in voice mode for hands-free, natural spoken communication.
- **Smart Intent Classification**: Distinguishes casual greetings from serious legal disputes to trigger appropriate workflows.

### 2. 🔍 Grounded RAG (Retrieval-Augmented Generation)
- **Hybrid Retrieval**: Combines semantic vector search (`BAAI/bge-small-en-v1.5`) with keyword search (`BM25Okapi`) fused via Reciprocal Rank Fusion (RRF).
- **Verified Statutory Knowledge Base**: Indexed Indian Bharatiya Nyaya Sanhita (BNS), BNSS, Consumer Protection Act, Rent Control Acts, Industrial Disputes Act, and landmark Supreme Court & High Court rulings.
- **Citation Grounding**: Every legal assertion links directly to verified statutes and precedents.

### 3. 📂 Document Evidence Audit
- **Smart Evidence Checklist**: Categorizes uploaded documents (receipts, lease agreements, WhatsApp logs, emails) into:
  - `✓ Verified`: Strong, clear proof.
  - `↑ Uploaded`: Document received, under review.
  - `! Needs Review`: Scan unclear or missing signature.
  - `○ Missing`: Recommended evidence needed to strengthen the case.

### 4. ⚖️ 5-Level Layered Legal Analysis
Provides a structured, easy-to-read breakdown for every query:
1. **Plain-Language Summary**: What is happening in simple terms.
2. **Applicable Laws & Provisions**: Specific Indian acts and section numbers.
3. **Your Fundamental Rights**: Plain-English rights under Indian law.
4. **Possible Legal Remedies**: Practical avenues available.
5. **Relevant Judgments & Precedents**: Real court decisions backing the user's position.

### 5. 🎯 Pre-Litigation Resolution Pathways
Calculates personalized recommendation scores for 4 distinct resolution avenues:
- **Direct Settlement Notice**: Fast, zero cost, maintains personal relationships.
- **Mediation / Lok Adalat / ADR**: Fast-track neutral third-party resolution.
- **Free Legal Aid (DLSA / NALSA)**: Guides eligible citizens to state-sponsored free legal support.
- **Formal Litigation**: Step-by-step preparation when court action is necessary.

### 6. 📄 Automated Document Generators
- **Legal Notice Generator**: Generates formatted, ready-to-send legal notices.
- **RTI Application Generator**: Prepares 100% compliant Right to Information filings under RTI Act 2005.
- **Judge-Ready Case Package Dossier**: Exportable 9-section structured PDF/Markdown dossier for legal aid attorneys or judges.

---

## 🏗️ Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (Next.js 14)                            │
│  Chat Page | Case Dashboard | Document Generator | Voice Mode | Demo Suite  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST / SSE
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND (FastAPI API)                            │
│  main.py ──► router (chat, rti, legal_notice, research, pdf_upload, etc.)   │
└──────────────┬───────────────────────┬───────────────────────┬──────────────┘
               │                       │                       │
               ▼                       ▼                       ▼
┌───────────────────────────┐ ┌───────────────────┐ ┌─────────────────────────┐
│     Hybrid RAG Engine     │ │   LLM Engine      │ │   Case Package Engine   │
│  BM25 + ChromaDB Vector   │ │   Groq Llama 3.3  │ │  Chronology & Evidence  │
│  BAAI/bge-small Embedder  │ │   Gemini Fallback │ │  Dossier Generator      │
└───────────────────────────┘ └───────────────────┘ └─────────────────────────┘
```

---

## 📂 Repository Structure

```
Nyaya-Ai/
├── app/                        # Next.js 14 App Router (Frontend)
│   ├── cases/[caseId]/         # Case Dashboard & Dossier Workspace
│   ├── chat/                   # AI Chat & Voice Interface
│   ├── demo/                   # Interactive Hackathon Evaluator Demo
│   ├── layout.tsx              # Root Layout with Theme & Providers
│   └── page.tsx                # Landing Page
├── backend/                    # FastAPI Backend Service
│   ├── app/
│   │   ├── api/                # API Routers (chat, rti, legal_notice, etc.)
│   │   ├── core/               # App Configuration & Settings
│   │   ├── rag/                # Hybrid RAG, ChromaDB & BM25 Retriever
│   │   ├── services/           # Legal Analysis, Intent & Case Engines
│   │   └── main.py             # FastAPI App Entry Point
│   ├── vector-db/              # ChromaDB Persistent Vector Storage
│   └── requirements.txt        # Python Backend Dependencies
├── components/                 # Reusable UI Components (Radix UI / Tailwind)
│   └── nyaya/                  # Nyaya Product UI Components
├── docs/                       # Project Documentation & Guides
├── lib/                        # Utility Libraries & State Managers
├── PRD.md                      # Product Requirement Document
└── README.md                   # Detailed Product Overview & Setup Guide
```

---

## 🛠️ Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Radix UI, Lucide Icons |
| **Backend API** | FastAPI (Python 3.10+), Uvicorn, Pydantic, SlowAPI Rate Limiting |
| **AI / LLM** | Groq LPU API (`llama-3.3-70b-versatile`), Google Gemini (Fallback) |
| **RAG / Vector DB** | ChromaDB, BM25Okapi, `BAAI/bge-small-en-v1.5` embeddings, Reciprocal Rank Fusion |
| **Database & Auth** | Supabase, PostgreSQL |
| **Testing** | Playwright E2E Suite, Pytest |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **Python**: `v3.10` or higher
- **npm**: `v10+`

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend will be running on `http://127.0.0.1:8000`*

---

### 2. Frontend Setup

```bash
# Navigate to project root directory
cd Nyaya-Ai

# Install Node dependencies
npm install

# Run TypeScript type check
npm run typecheck

# Start development server
npm run dev
```
*Frontend will be running on `http://localhost:3000`*

---

## ⚙️ Environment Variables

Create `.env.local` in the root folder for Frontend:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Create `.env` in `backend/` directory for Backend:
```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🔌 API Endpoints Summary

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/` | GET | Root health check & greeting |
| `/health` | GET | Health status check |
| `/chat` | POST | Main Legal Chat & RAG Analysis endpoint |
| `/api/rti/generate` | POST | Generate RTI Application draft |
| `/api/legal-notice/generate` | POST | Generate Formal Legal Notice draft |
| `/api/speech/transcribe` | POST | Audio speech-to-text transcription |
| `/api/pdf/upload` | POST | Document evidence OCR upload & audit |

---

## 🧪 Testing & Verification

```bash
# Run Frontend Playwright E2E tests
npx playwright test

# Run Backend Pytest suite
cd backend
pytest
```

---

## 🛡️ Trust & Safety Guardrails

- **Informational Support**: Nyaya AI provides legal information and decision support, not binding legal advice.
- **No Misleading Win Estimates**: Nyaya AI does not generate fake "win percentages." Case readiness is evaluated qualitatively based on evidence completeness.
- **Privacy First**: User case facts and uploaded documents are encrypted and never used for public AI training.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
