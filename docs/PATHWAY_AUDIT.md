# Nyaya AI — 9-Pathway Router Forensic Audit (`pathway_router.py`)

**Engine File**: `backend/app/services/pathway_router.py`  
**Model Enum**: `backend/app/models/pathway.py` (`LegalPathway`)  
**Audit Date**: September 4, 2026  
**Status**: 100% IMPLEMENTED & VERIFIED  

---

## 9-Pathway Router Audit Breakdown

The PPT explicitly claims a **9-pathway router (`pathway_router.py`)** that dynamically directs legal disputes to appropriate resolution mechanisms based on intake data, eligibility rules, and statutory constraints.

| # | Pathway Enum (`LegalPathway`) | Trigger Condition / Rule | Engine / Service | Backend API | Frontend Component / Route | Verification Status |
|:---|:---|:---|:---|:---|:---|:---|
| 1 | `SETTLEMENT` | Pre-litigation civil/rental dispute with negotiable monetary terms | `settlement_engine.py` | `POST /api/legal-notice/generate` | `/cases/[caseId]/settlement` | 🟢 VERIFIED_WORKING |
| 2 | `MEDIATION` | Pre-litigation dispute involving ongoing relationship (tenancy, employment) | `adr_engine.py` | `POST /api/case-understanding/analyze` | `/cases/[caseId]/adr` | 🟢 VERIFIED_WORKING |
| 3 | `LEGAL_AID` | Statutory income or Section 12 category match under LSA Act, 1987 | `legal_aid.py` | `GET /api/legal-aid/evaluate` | `/cases/[caseId]/legal-aid` | 🟢 VERIFIED_WORKING |
| 4 | `INDIVIDUAL_LITIGATION` | Urgent court remedy needed or safety alert triggered | `case_workflow.py` | `POST /api/case-understanding/analyze` | `/cases/[caseId]` | 🟢 VERIFIED_WORKING |
| 5 | `CLUSTER_REVIEW` | Multiple complaints matching counterparty, issue & window | `cluster_engine.py` | `GET /api/collective-actions` | `/cluster-cases` | 🟢 VERIFIED_WORKING |
| 6 | `PIL_REVIEW` | Public interest, environmental, or fundamental rights indicator | `pil_engine.py` | `POST /api/systemic-action` | `/app/intelligence` | 🟢 VERIFIED_WORKING |
| 7 | `LOK_ADALAT_REVIEW` | Compoundable civil/financial dispute suitable for statutory bench | `adr_engine.py` | `POST /api/adr/evaluate` | `/cases/[caseId]/adr` | 🟢 VERIFIED_WORKING |
| 8 | `REGULATORY_REFERRAL` | Dispute falling under specialized forum (RERA, RBI Ombudsman, Consumer) | `authority_router.py` | `POST /api/authority-complaint` | `/complaints` | 🟢 VERIFIED_WORKING |
| 9 | `DOCUMENT_COMPLETION` | Incomplete intake facts or missing essential evidence scans | `case_document_verifier.py` | `POST /api/documents/verify` | `/cases/[caseId]/documents` | 🟢 VERIFIED_WORKING |

---

## Detailed Code Verification

1. **Safety Override**:
   - If `has_immediate_safety_concern` is True, `pathway_router.py` immediately overrides all score options to route to `INDIVIDUAL_LITIGATION` with `confidence=0.95`.

2. **Limitation Period Override**:
   - Integrated with `deadline_engine.py` to prevent expiring limitation claims from being delayed in mediation.

3. **Deterministic & Advisory Scoring**:
   - Returns structured `PathwayRecommendation` with `requires_human_review=True` in compliance with NALSA Tele-Law disclaimer principles.
