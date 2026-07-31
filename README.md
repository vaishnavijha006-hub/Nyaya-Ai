# Nyaya AI (न्याय AI) — AI-Powered Indian Legal Intelligence & Assistant Platform

![Nyaya AI](https://img.shields.io/badge/Production-Ready-brightgreen.svg)
![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)
![Groq Llama 3.3](https://img.shields.io/badge/AI-Groq%20Llama%203.3%2070B-orange)
![Hybrid RAG](https://img.shields.io/badge/Search-BM25%20%2B%20ChromaDB%20RRF-purple)

> **Nyaya AI** is an production-grade AI platform designed to make Indian law simple, accessible, and actionable for citizens, students, legal professionals, UPSC aspirants, and consumers.

---

## 🌟 Key Features

- 🏛️ **AI Legal Assistant with Multi-Audience Tuning**: Context-aware legal explanations tailored for Citizens, Students, Lawyers, UPSC Aspirants, and Children.
- ⚡ **Hybrid RAG Engine (BM25 + Vector Search)**: Merges sparse keyword search (BM25) and dense semantic vector search (`BAAI/bge-small-en-v1.5`) via **Reciprocal Rank Fusion (RRF)** for zero-hallucination accuracy.
- 📜 **Statute Coverage**: Grounded in official text of the **Constitution of India**, **Bharatiya Nyaya Sanhita (BNS)**, **Bharatiya Nagarik Suraksha Sanhita (BNSS)**, **Bharatiya Sakshya Adhiniyam (BSA)**, RTI Act, IT Act, and landmark Supreme Court judgments.
- 📄 **Automated Document Drafting**:
  - **RTI Application Generator**: Generates formatted Right to Information applications ready for submission to PIOs.
  - **Legal Notice Generator**: Generates formal legal notices formatted for Indian legal standards.
- 📁 **Session-Scoped PDF RAG**: Upload legal PDFs and query document contents dynamically with custom vector collections.
- 🎙️ **Offline Voice AI**: Transcribes speech via Whisper STT and synthesizes neural audio via Piper ONNX.
- ⚡ **Server-Sent Events (SSE)**: Real-time token streaming with live status updates and structured legal citations.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18, Tailwind CSS, Framer Motion, Radix UI
- **State & Streaming**: Server-Sent Events (SSE), Custom Hooks (`useStreamingChat`, `useConversations`)

### Backend & AI Architecture
- **Framework**: FastAPI (Python 3.14)
- **LLM Provider**: Groq LPU API (`llama-3.3-70b-versatile`)
- **Vector DB & Retrieval**: ChromaDB, BM25Okapi, BAAI/bge-small-en-v1.5
- **Database & Auth**: Supabase, PostgreSQL
- **Audio Processing**: Whisper STT, Piper Neural Voice ONNX

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- Groq API Key & Supabase Account

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🛡️ Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
GROQ_API_KEY=<your-groq-api-key>
```

---

## 📜 License
This project is licensed under the MIT License.
