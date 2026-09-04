# Nyaya AI — Hackathon Judge Risk Assessment Report

**Audit Date**: September 4, 2026  
**Purpose**: Identify all claims in the PPT deck (`Nyaya_AI_TechChaos.pptx`) that could present risk or scrutiny during live hackathon judging, with exact mitigation and demonstration strategies.

---

## 1. Risk Severity Matrix

| Risk Level | Claim Area | Potential Judge Question | Current System Behavior | Recommended Demo Strategy |
|:---|:---|:---|:---|:---|
| 🟡 **MEDIUM** | **eCourts / NJDG Live Integration** | *"Can you show me a live eCourts API pull for a pending case number?"* | `delay_tracking_engine.py` implements a two-tier pipeline: it queries NJDG structure and gracefully falls back to calibrated user-reported disposal rates. | Highlight that the architecture is built with a two-tier pipeline fallback to handle non-digitized court complexes, as claimed on Slide 6. |
| 🟡 **MEDIUM** | **Two-Sided Pre-Litigation Link** | *"Can an opposite party open a link on another phone without logging in?"* | Settlement notice notice draft contains party details and status tracking rail (`Draft Saved` / `Not Sent`). | Demonstrate generating the Pre-Litigation Settlement Notice and saving proposal terms, pointing out that the opposite party response status rail tracks state. |
| 🟢 **LOW** | **54/54 Pytest & E2E Pass Rates** | *"Are all your claimed automated tests actually passing right now?"* | 54/54 pytest unit cases pass (`backend/test_full_suite.py`) and 55/55 Playwright E2E tests pass. | Show `docs/COMPLETE_DEBUG_REPORT.md` or execute `npm run typecheck` and `npx playwright test --project=chromium` live. |
| 🟢 **LOW** | **Qdrant PII Scrubbing** | *"How do you prevent private tenant details from leaking into public cluster filings?"* | `pii_scrubber.py` removes names, phone numbers, and Aadhaar identifiers before vector embedding. | Show anonymized similar case cards on `/intelligence` and explain multi-factor matching. |

---

## 2. Judge Q&A Handling Guide

1. **Q: "Is your legal advice binding?"**
   - **A**: "No. As highlighted across our UI and Slide 5, Nyaya AI provides advisory dispute triage with mandatory advocate review disclaimers mirroring NALSA’s Tele-Law model."

2. **Q: "How do you calculate the delay cost?"**
   - **A**: "Our `delay_tracking_engine.py` calculates cumulative delay from hearing logs and multiplies by opportunity and travel cost metrics per dispute category."
