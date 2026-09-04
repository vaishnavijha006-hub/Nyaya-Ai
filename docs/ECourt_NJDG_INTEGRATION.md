# Nyaya AI — Official NJDG & eCourts Case Data Integration Architecture

## 1. Overview & Objectives

The NJDG (National Judicial Data Grid) and eCourts integration architecture provides a structured, truthful, and modular mechanism for querying Indian court case details via **CNR** (Case Number Record — 16-character unique alphanumeric identifier) or standard Court Case Numbers.

This integration powers Nyaya AI's **Delay Intelligence Engine**, feeding verified hearing logs, adjournment counts, stage progression data, and case age directly into analytics without falsifying live credentials or bypassing security boundaries.

---

## 2. Architecture & Multi-Mode Provider Pattern

Nyaya AI implements a clean `CourtDataProvider` abstraction located at `backend/app/services/court_data_provider.py`.

```
[ Frontend: CourtLookupSection ]
              │
              ▼
[ FastAPI Endpoint: POST /api/court-data/case-lookup ]
              │
              ▼
[ Provider Factory: get_court_data_provider() ]
              ├── LIVE (OfficialECourtsProvider)
              ├── DEMO (DemoCourtDataProvider)
              └── FALLBACK (FallbackCourtDataProvider)
              │
              ▼
[ Delay Intelligence Engine: evaluate_case_delay_intelligence() ]
              │
              ▼
[ Normalized Response + Source Authenticity Badge + Non-Judgment Disclaimer ]
```

### Operational Modes

1. **`LIVE` Mode (`OfficialECourtsProvider`)**
   - Triggered when `ECOURTS_API_URL` and `ECOURTS_API_KEY` (or `ECOURTS_CLIENT_ID`) environment variables are configured.
   - Issues machine-readable HTTP requests with a strict 5-second timeout.
   - Formats raw portal output into Nyaya AI's canonical schema.
   - Tagged: `"Source: Official eCourts/NJDG API"` | `"source_mode": "LIVE"`.

2. **`DEMO` Mode (`DemoCourtDataProvider`)**
   - Triggered when `ECOURTS_DEMO_MODE=true` is set.
   - Provides deterministic, high-fidelity hearing history simulating live court API responses for hackathon judging and offline demonstrations.
   - Tagged: `"Source: Official eCourts/NJDG API (Demo Simulation)"` | `"source_mode": "DEMO"`.

3. **`FALLBACK` Mode (`FallbackCourtDataProvider`)**
   - Triggered when live credentials are unconfigured or endpoints are unreachable.
   - Provides calibrated user-reported hearing benchmarks.
   - **Strict Truthfulness Constraint**: Explicitly labeled as user-reported data. Never pretends data originated from NJDG/eCourts.
   - Tagged: `"Source: User-reported data"` | `"source_mode": "FALLBACK"`.

---

## 3. Data Normalization & Validation

### CNR / Identifier Validation
- **CNR Pattern**: `^[A-Z]{4}\d{12}$` (16 alphanumeric characters: 2-char State Code + 2-char District Code + 2-digit Establishment Code + 6-digit Case Number + 4-digit Year, e.g., `UPGB010012342024`).
- **Case Number Pattern**: Standard court case number format (e.g., `CC/1024/2023`).

### Canonical Schema Output
```json
{
  "source": "Official eCourts/NJDG API",
  "source_mode": "LIVE",
  "identifier_type": "CNR",
  "identifier": "UPGB010012342024",
  "court": "District & Sessions Court, Ghaziabad",
  "case_number": "Suit No. 1234/2024",
  "case_type": "Civil Dispute (Recovery & Tenancy)",
  "filing_date": "2026-01-15",
  "status": "Pending (Evidence Stage)",
  "next_hearing_date": "2026-09-30",
  "hearing_history": [ ... ],
  "orders": [ ... ],
  "last_updated": "2026-09-04T12:00:00Z"
}
```

---

## 4. Legal & Non-Judgment Safety Boundaries

Nyaya AI operates strictly within ethical legal tech guidelines:
1. **No Unapproved Scraping**: The system does NOT scrape CAPTCHAs or bypass authentication/rate limits. It uses machine-readable official endpoints or fallback options.
2. **Non-Judgment Disclaimer**: Every lookup payload includes the mandatory disclaimer:
   > *"This system displays data retrieved from official court records or user-reported inputs. Nyaya AI does not judge whether adjournments or delays were legally justified."*
3. **Tenant Data Isolation**: RLS and session isolation principles are preserved across all lookup endpoints.

---

## 5. Verification & Test Coverage

- **Backend Pytest Suite**: `backend/test_court_data_provider.py` (8/8 tests passing).
- **Playwright E2E Suite**: `tests/phase14-ecourts-lookup.spec.ts` (3/3 tests passing).
- **TypeScript Static Verification**: `npm run typecheck` (0 errors).
