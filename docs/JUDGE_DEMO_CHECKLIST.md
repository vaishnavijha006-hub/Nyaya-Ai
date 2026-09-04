# Nyaya AI — Live Judge Demo Checklist

**Date**: September 4, 2026  
**Purpose**: Practical step-by-step demonstration checklist matching every PPT claim to its exact live website location and expected result.

---

## Live Judge Demonstration Matrix

| # | Judge Question / Challenge | PPT Claim | Where to Demonstrate | Expected Result | Status |
|---|---------------------------|-----------|----------------------|-----------------|--------|
| 1 | *"Show me how a citizen enters a legal problem."* | Conversational Intake (Slide 3) | `http://localhost:3000/` | Type *"Landlord locked me out and won't refund ₹50,000"*, click **Analyze Problem**. Redirects to `/chat` with live streaming advice. | 🟢 VERIFIED |
| 2 | *"Show me the 5 Citizen Questions dashboard."* | Understand, Verify, Explain, Eligibility, Act (Slide 3) | `http://localhost:3000/cases/case-1` | Renders 5 questions: What Happened, Classification, Evidence Matrix, Legal Provisions, and Action Plan. | 🟢 VERIFIED |
| 3 | *"Can I complete an action step and will it remember?"* | Action Engine & Persistence (Slide 3 & 7) | `http://localhost:3000/cases/case-1` | Click **Mark Step Complete** in Action Plan. Refresh page — step status stays complete. | 🟢 VERIFIED |
| 4 | *"Show me Section 12 Legal Aid eligibility."* | Section 12 LSA Act & DLSA match (Slide 3 & 6) | `http://localhost:3000/cases/case-1/legal-aid` | Displays statutory income limits, Section 12 criteria, and nearest DLSA Ghaziabad contact details. | 🟢 VERIFIED |
| 5 | *"Show me a pre-litigation legal notice draft."* | Pre-Litigation Settlement Notice & PDF (Slide 4 & 7) | `http://localhost:3000/cases/case-1/settlement` | Shows requested amount ₹50,000, terms editor, voluntary disclaimers, and PDF export trigger. | 🟢 VERIFIED |
| 6 | *"Show me the Judge-Ready Case Package."* | 9-Section Dossier (Slide 3 & 7) | `http://localhost:3000/cases/case-1/case-package` | Displays 80% readiness badge, 9 structured dossier sections, and mandatory advocate disclaimers. | 🟢 VERIFIED |
| 7 | *"How do you track case delays and adjournment costs?"* | Adjournment & Delay Intelligence (Slide 4) | `http://localhost:3000/cases/case-1` | Scroll to Delay Intelligence section showing hearing logs and cumulative delay calculations. | 🟢 VERIFIED |
| 8 | *"Show me cluster filing & systemic action."* | Cluster Case Filing & PIL (Slide 4 & 6) | `http://localhost:3000/cluster-cases` & `/intelligence` | Renders collective action cluster cards and anonymized PIL pattern briefs. | 🟢 VERIFIED |
| 9 | *"Is access protected if I try to open someone else's workspace?"* | Multi-Tenant Session Isolation (Slide 7 & 8) | `http://localhost:3000/workspace` (in incognito window) | Automatically redirects unauthenticated user to `/auth`. | 🟢 VERIFIED |
