"""
adr_engine.py — Deterministic ADR Pathway Routing Engine for Nyaya AI.

Evaluates dispute parameters against deterministic statutory rules to recommend ADR pathways:
1. Mediation (Mediation Act 2023 / Section 12A Commercial Courts Act 2015)
2. Lok Adalat (Section 19 Legal Services Authorities Act 1987)
3. Permanent Lok Adalat (Section 22B Legal Services Authorities Act 1987 - Public Utility Services)
4. Arbitration (Arbitration & Conciliation Act 1996)
5. Regular Judicial Litigation (Non-compoundable criminal / urgent court injunctions)

LLM is used only for extracting facts and explaining the pathway.
Never claims ADR is legally mandatory unless supported by statutory authority.
"""
import logging
from typing import Dict, Any, Optional, List
from app.models.adr import ADRPathway, ADROutcome, ADRRecommendation

logger = logging.getLogger(__name__)

# Public Utility Services (Permanent Lok Adalat - Section 22B LSA Act 1987)
PUBLIC_UTILITY_KEYWORDS = [
    "electricity", "power supply", "water supply", "sanitation", "telegraph",
    "telephone", "telecom", "postal", "passenger transport", "freight transport",
    "hospital", "dispensary", "public conservancy", "insurance service"
]

UNSUITABLE_CATEGORIES = {
    "SERIOUS_CRIMINAL", "HOMICIDE", "SEXUAL_OFFENSE", "DOMESTIC_VIOLENCE_URGENT", "PUBLIC_FRAUD"
}

LOK_ADALAT_CATEGORIES = {
    "CHEQUE_BOUNCE", "MOTOR_ACCIDENT", "BANK_RECOVERY", "UTILITY_BILL_DISPUTE", "INSURANCE_CLAIM", "COMPOUNDABLE_OFFENSE"
}


def evaluate_adr_suitability(
    case_info: Dict[str, Any],
    session_state: Optional[Dict[str, Any]] = None,
) -> ADRRecommendation:
    """
    Evaluates dispute parameters and returns structured ADRRecommendation with process guidance.
    """
    if session_state is None:
        session_state = {}

    category = (case_info.get("category") or "").upper()
    issue = case_info.get("issue") or ""
    facts = " ".join(case_info.get("key_facts", [])).lower()
    combined = f"{issue} {facts}".lower()
    urgency = (case_info.get("urgency") or "").lower()
    has_arbitration_clause = "arbitration" in combined or "arbitrator" in combined

    reasons: List[str] = []
    conditions: List[str] = []
    warnings: List[str] = []

    # 1. Unsuitable for ADR -> Regular Litigation
    if category in UNSUITABLE_CATEGORIES or "murder" in combined or "rape" in combined or "serious fraud" in combined:
        pathway = ADRPathway.LITIGATION
        outcome = ADROutcome.LITIGATION_REVIEW
        is_eligible = False
        reasons.append("Dispute involves non-compoundable criminal charges or severe public interest violations unsuitable for ADR.")
        warnings.append("ADR mechanisms cannot settle non-compoundable criminal offenses.")
        
        adr_expl = "Regular judicial litigation is recommended because non-compoundable criminal offenses or serious public violations cannot be settled out of court."
        req_info = ["Police FIR copy / Charge sheet", "Witness statements", "Medical/Forensic reports"]
        doc_checklist = ["Vakalatnama", "Complaint petition", "Evidence annexures"]
        process_overview = [
            "1. Advocate Consultation: Engage a criminal law practitioner.",
            "2. Court Filing: File complaint / bail application before competent Magistrate or Sessions Court.",
            "3. Trial Proceedings: Evidence submission, cross-examination, and judicial judgment."
        ]
        next_step = "Consult a criminal defense or prosecution advocate for regular court filing."

    # 2. Permanent Lok Adalat (Section 22B LSA Act 1987 - Public Utility Services)
    elif any(u in combined for u in PUBLIC_UTILITY_KEYWORDS) and "permanent" in combined or (category in ["GOVERNMENT_SERVICE", "PUBLIC_HEALTH"] and any(u in combined for u in ["water", "electricity", "telecom", "hospital"])):
        pathway = ADRPathway.PERMANENT_LOK_ADALAT
        outcome = ADROutcome.PERMANENT_LOK_ADALAT_REVIEW
        is_eligible = True
        reasons.append("Dispute concerns a statutory Public Utility Service under Section 22B of the Legal Services Authorities Act, 1987.")
        conditions.append("Dispute value must not exceed ₹1 Crore (or limit fixed by Central Government).")
        conditions.append("Matter must not relate to a non-compoundable offense.")
        warnings.append("An award made by Permanent Lok Adalat is final, binding, and non-appealable.")

        adr_expl = "Permanent Lok Adalat provides pre-litigation conciliation and binding adjudication for Public Utility Services (electricity, water, transport, hospital, telecom)."
        req_info = ["Utility bill / Service account number", "Written complaint to utility provider", "Proof of deficiency in service"]
        doc_checklist = ["Identity proof", "Service connection agreement / Utility bills", "Dispute correspondence"]
        process_overview = [
            "1. Application Filing: Submit pre-litigation application to Permanent Lok Adalat.",
            "2. Conciliation Phase: PLA conducts conciliation proceedings between parties.",
            "3. Adjudication: If conciliation fails, PLA adjudicates the dispute on merits."
        ]
        next_step = "File an application before the Permanent Lok Adalat in your district court complex."

    # 3. Lok Adalat (Section 19 LSA Act 1987)
    elif category in LOK_ADALAT_CATEGORIES or "cheque" in combined or "138" in combined or "accident claim" in combined:
        pathway = ADRPathway.LOK_ADALAT
        outcome = ADROutcome.LOK_ADALAT_REVIEW
        is_eligible = True
        reasons.append("Dispute falls under compoundable monetary, cheque bounce, or motor accident categories suitable for Lok Adalat referral [Section 19 LSA Act 1987].")
        conditions.append("Both parties must consent to amicable settlement or one party applies for pre-litigation Lok Adalat reference.")
        warnings.append("Lok Adalat award has the decree status of a Civil Court and is final and non-appealable.")

        adr_expl = "Lok Adalat is a statutory forum providing fast-track, free dispute settlement. Court fees paid are refunded if a pending case is settled in Lok Adalat."
        req_info = ["Dishonoured cheque copy & bank return memo (for Sec 138)", "Accident FIR & Medical bills (for MACT)", "Settlement proposal amount"]
        doc_checklist = ["Section 138 statutory notice & postal receipt", "Bank return memo", "ID proof"]
        process_overview = [
            "1. Reference: Case referred to Lok Adalat by court or via pre-litigation DLSA application.",
            "2. Amicable Discussion: Presiding officer and conciliators facilitate compromise.",
            "3. Final Award: Award passed upon mutual consent, binding on both parties."
        ]
        next_step = "Submit a pre-litigation Lok Adalat application to the District Legal Services Authority (DLSA)."

    # 4. Arbitration (Arbitration & Conciliation Act 1996)
    elif has_arbitration_clause:
        pathway = ADRPathway.ARBITRATION
        outcome = ADROutcome.OTHER_ADR_REVIEW
        is_eligible = True
        reasons.append("Executed contract contains an explicit Arbitration Agreement clause governed by the Arbitration & Conciliation Act, 1996.")
        conditions.append("Notice of Invocation must be served on the opposite party specifying the arbitration clause.")
        warnings.append("Arbitration proceedings involve private tribunal costs unless institutional rules specify otherwise.")

        adr_expl = "Arbitration is a private, formal dispute resolution process where an independent Arbitrator issues a legally binding Arbitral Award."
        req_info = ["Executed contract copy containing Arbitration Clause", "Notice of Invocation text", "Claim statement & breakdown"]
        doc_checklist = ["Contract agreement with arbitration clause", "Postal proof of invocation notice", "Financial statement of claim"]
        process_overview = [
            "1. Invocation Notice: Serve Section 21 notice invoking arbitration.",
            "2. Arbitrator Appointment: Appoint arbitrator per agreed contract procedure or Section 11 court application.",
            "3. Award & Execution: Arbitral tribunal conducts hearing and issues enforceable award."
        ]
        next_step = "Draft and issue a formal Notice of Invocation of Arbitration to the opposite party."

    # 5. Mediation (Mediation Act 2023 / Commercial Courts Act Section 12A)
    else:
        pathway = ADRPathway.MEDIATION
        outcome = ADROutcome.MEDIATION_REVIEW
        is_eligible = True
        reasons.append("Dispute concerns civil, commercial, rental, or family matters suitable for voluntary or court-annexed mediation.")
        
        if category == "COMMERCIAL_CONTRACT" and urgency not in ["high", "critical", "emergency"]:
            reasons.append("Pre-Institution Mediation is mandatory for commercial suits not contemplating urgent interim relief [Section 12A Commercial Courts Act 2015].")
            conditions.append("Section 12A mandatory pre-institution mediation applies prior to filing commercial litigation.")
        else:
            conditions.append("Mediation requires voluntary participation of both parties.")
        
        warnings.append("Mediation settlement agreements become legally binding only after signing and registration under the Mediation Act, 2023.")

        adr_expl = "Mediation is a confidential, voluntary process where a neutral trained Mediator assists parties in negotiating a mutually acceptable settlement."
        req_info = ["Summary of dispute and key facts", "Proposed settlement terms", "Contact details of both parties"]
        doc_checklist = ["Identity proof", "Contract / Lease deed / Service agreement", "Correspondence logs"]
        process_overview = [
            "1. Initiation: File application at Court-Annexed Mediation Centre or DLSA.",
            "2. Joint & Private Sessions: Mediator facilitates dialogue and option generation.",
            "3. Settlement Agreement: Executed agreement signed by parties and authenticated by mediator."
        ]
        next_step = "Submit a Pre-Litigation Mediation application before the local District Legal Services Authority or Court Mediation Centre."

    return ADRRecommendation(
        pathway=pathway,
        reasons=reasons,
        conditions=conditions,
        warnings=warnings,
        requires_human_review=True,
        adr_explanation=adr_expl,
        required_information=req_info,
        document_checklist=doc_checklist,
        process_overview=process_overview,
        next_step_guidance=next_step,
        adr_outcome=outcome,
        suitability_explanation=adr_expl,
        is_eligible_for_adr=is_eligible,
        factors_considered={
            "dispute_category": category,
            "pathway": pathway.value,
            "urgency": urgency or "Normal",
            "is_eligible": is_eligible,
        },
        adr_summary=f"Recommended ADR Pathway: {pathway.value}. Status: {'Eligible' if is_eligible else 'Litigation Preferred'}.",
        issues_in_dispute=[issue] if issue else [f"Dispute regarding {category.replace('_', ' ').title()}"],
        parties_positions={
            "Party A": case_info.get("complainant", "Initiating Party"),
            "Party B": case_info.get("parties", "Opposite Party"),
        },
        documents=doc_checklist,
        unresolved_questions=[
            "Whether both parties agree to voluntary conciliation/mediation participation?",
            "Is protective court filing required for statutory limitation deadlines?"
        ],
        suggested_next_step=next_step,
        metadata={"category": category, "pathway": pathway.value},
    )
