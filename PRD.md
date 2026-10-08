# ⚖️ Nyaya AI (न्याय AI) — Product Requirement Document (PRD)

> **"Empowering every Indian citizen to navigate the legal system with confidence, clarity, and dignity."**

---

## 📄 1. Product Overview & Human Mission

Navigating the legal system in India is often overwhelming, expensive, and deeply stressful for ordinary citizens. From cryptic legal jargon and high advocate fees to endless court delays, millions of people feel powerless when facing unfair landlord disputes, unpaid wages, delayed civic services, or consumer fraud.

**Nyaya AI (न्याय AI)** is a citizen-first, AI-powered legal journey platform designed to humanize Indian law. Instead of dumping raw legal text or giving vague advice, Nyaya AI walks alongside the user step-by-step — transforming anxiety into actionable clarity. It takes users from raw emotional distress to structured facts, evidence gathering, actionable legal steps, pre-litigation resolution (like mediation and Lok Adalat), and advocate-ready case dossiers.

---

## 🤝 2. The Human Problem & Real-World Context

### The Reality on the Ground
1. **Intimidation & Jargon Barrier**: Indian legal statutes use dense, archaic terminology (e.g., *interim injunction*, *cognizable offense*, *ex-parte*). Ordinary citizens struggle to understand what laws apply to them or what rights they hold.
2. **Economic Exclusion**: Consulting a lawyer for initial guidance costs thousands of rupees — an expense many lower and middle-income families cannot afford.
3. **Premature Court Pendency**: Over **50 million cases** are currently pending in Indian courts. A massive portion of these disputes could be resolved faster through direct notices, Lok Adalats, or consumer forums if citizens knew how to organize their facts early.
4. **Disorganized Proof**: Citizens often possess WhatsApp chats, receipts, and emails, but do not know how to arrange them chronologically into evidence that a court or mediator can evaluate.

---

## 💡 3. Product Principles & Core Philosophy

- **Empathy First, Jargon Second**: Every explanation is delivered in warm, clear, everyday language before introducing specific legal sections.
- **Progressive Guidance, Not a Static Search Engine**: Nyaya AI does not just answer a single question; it guides users through a structured journey (*Facts → Proof → Options → Action Plan*).
- **Resolution Over Litigation**: We prioritize peaceful, fast, low-cost pre-litigation paths (Direct Negotiation, Legal Notices, Mediation, RTI) over immediate court filings.
- **Judge & Advocate Ready**: When court action is necessary, Nyaya generates clean, professional dossiers that save hours for legal aid attorneys and judges.
- **Zero Misleading Promises**: We never calculate or show fake "win percentages." Case strength is evaluated on proof completeness and factual clarity.

---

## 👥 4. User Personas & Real-World Scenarios

### Persona 1: Ramesh Kumar (Tenant, Bengaluru)
- **Background**: Ramesh, a 28-year-old software engineer, paid a ₹1,00,000 security deposit. After moving out, the landlord refused to refund the money, ignoring calls.
- **Goal**: Wants his money back quickly without spending money on expensive court fees.
- **How Nyaya Helps**: Guides Ramesh to upload his rent agreement and UPI receipts, drafts a formal Legal Notice to the landlord, and explains how to approach the Rent Control Authority if needed.

### Persona 2: Priya Sharma (IT Professional, Pune)
- **Background**: Worked at a startup that suddenly shut down without paying 3 months of pending salary.
- **Goal**: Understands her employment rights and wants a clean case summary to hand over to a Legal Aid attorney.
- **How Nyaya Helps**: Extracts salary slips and resignation emails into a chronological timeline, generates a Case Package Dossier, and outlines a step-by-step Labour Court recovery plan.

### Persona 3: Sunita Devi (Homemaker & Citizen, Jaipur)
- **Background**: Applied for a civic water connection months ago, but local authorities have taken no action despite multiple follow-ups.
- **Goal**: Needs transparency on why her application is delayed.
- **How Nyaya Helps**: Uses voice input in Hindi to explain her issue. Nyaya AI generates a formal Right to Information (RTI) application addressed to the Public Information Officer (PIO).

---

## 🗺️ 5. End-to-End User Experience & Journey Map

```
  [User Facing Issue]
           │
           ▼
┌──────────────────────────┐
│ 1. Conversational Intake │ ◄── Multi-lingual text or voice input in everyday words
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 2. Fact Extraction       │ ◄── Auto-organize parties, dates, events, and key issues
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 3. Document Proof Audit  │ ◄── Audit receipts, agreements & highlight missing evidence
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 4. Plain-English Analysis│ ◄── Grounded in Indian statutes (IPC/BNS, Rent Acts, Consumer Law)
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 5. Resolution Pathways   │ ◄── Direct Settlement | Mediation | Legal Notice | Formal Filing
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 6. Action Plan & Dossier │ ◄── Downloadable Judge-Ready Case Package + RTI/Notice Drafts
└──────────────────────────┘
```

---

## ⚙️ 6. Key Feature Specifications

### 6.1 Conversational Intake & Multi-lingual Voice Interface
- **Natural Chat**: Users describe what happened without needing to know legal terms.
- **Voice Support**: Speak in Hindi, English, or regional languages with real-time speech-to-text.
- **Smart Intent Classifier**: Automatically detects whether the user is asking a general casual question or sharing a serious legal dispute.

### 6.2 Grounded Retrieval-Augmented Generation (RAG)
- **Authoritative Law Database**: RAG pipeline indexes verified Indian statutes (BNS, BNSS, Consumer Protection Act, Rent Control Acts, Labour Laws) and landmark Supreme Court / High Court precedents.
- **Citation Integrity**: Every legal assertion is backed by transparent citation cards linking directly to applicable sections and acts.

### 6.3 Document Evidence Audit
- **Smart Proof Checklist**: Categorizes uploaded documents into:
  - `✓ Verified`: Strong proof (signed rent agreement, bank transfer statement).
  - `↑ Uploaded`: Received but needs clarity.
  - `! Needs Review`: Unclear scan or incomplete date.
  - `○ Missing`: Suggested proof (e.g., written notice copy).

### 6.4 Pre-Litigation Resolution Engine
Calculates transparent recommendation scores for multiple resolution paths:
1. **Direct Negotiation / Settlement Notice**: Fast, zero cost, maintains personal relationships.
2. **Mediation / Lok Adalat / ADR**: Fast-track, neutral third-party mediation.
3. **Free Legal Aid (DLSA / NALSA)**: Guides eligible citizens to state-sponsored free legal support.
4. **Formal Court Filing**: Reserved as a final resort when pre-litigation fails.

### 6.5 Automated Document Draft Generators
- **Legal Notice Generator**: Generates formatted legal notices ready to send via registered post.
- **RTI Application Generator**: Prepares 100% compliant Right to Information filings under RTI Act 2005.

### 6.6 Judge-Ready Case Package Dossier
- Exportable, 9-section structured PDF / Markdown dossier containing:
  - Case Overview & Parties Involved
  - Factual Chronology
  - Evidence & Proof Matrix
  - Applicable Statutes & Precedents
  - Selected Resolution Pathway & Step-by-Step Action Log

---

## 🔒 7. Privacy, Security & Ethics

- **Private & Confidential**: User case facts and uploaded documents are encrypted and never sold or used for public AI training.
- **Clear Non-Advocate Disclaimer**: Nyaya AI explicitly informs users that it provides structured legal information and decision support, not binding legal advice.
- **Mandatory Advocate Review**: Generated court packages include a reminder to consult a registered advocate or legal aid volunteer before formal submission.

---

## 🎯 8. Success Metrics & Impact Goals

- **Reduction in Anxiety**: 90%+ of users report feeling clearer and more confident after completing intake.
- **Pre-Litigation Resolution Rate**: Target 40% of civil disputes resolved via direct settlement or RTI without entering court.
- **Time Saved for Legal Aid**: Cuts initial factual intake time for DLSA legal aid lawyers by **75%**.

---

## 📌 9. Rollout & Future Roadmap

- **Phase 1 (Current - Hackathon MVP)**: Core RAG, Legal Analysis, Intake, Case Package Generator, RTI & Notice Drafts, Voice Mode.
- **Phase 2 (Near-Term)**: WhatsApp Bot Integration, Regional Language Audio Explanations, DLSA Portal Connect.
- **Phase 3 (Long-Term)**: E-Courts API integration for automated case status tracking & pendency reduction analytics.