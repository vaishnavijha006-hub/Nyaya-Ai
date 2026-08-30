"""
lawyer_matcher.py — Matches lawyers from the Legal Saathi network.
Queries the Supabase lawyer_profiles table and falls back gracefully.
"""
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Category to specialization mapping
CATEGORY_SPECIALIZATION_MAP = {
    "tenant_landlord": ["property", "civil", "rent", "tenancy", "real estate"],
    "domestic_family": ["family", "matrimonial", "divorce", "domestic violence", "women rights"],
    "consumer_complaint": ["consumer", "civil", "tort"],
    "employment_dispute": ["labour", "employment", "industrial", "service law"],
    "property_dispute": ["property", "civil", "real estate", "land acquisition"],
    "cybercrime": ["cyber", "criminal", "it law"],
    "fraud": ["criminal", "civil", "fraud"],
    "contract_dispute": ["civil", "contract", "commercial"],
    "harassment": ["criminal", "women rights", "civil"],
    "criminal_complaint": ["criminal", "sessions", "high court"],
    "government_service": ["administrative", "constitutional", "writ"],
    "rti": ["rti", "administrative", "constitutional"],
    "environmental_public": ["environmental", "pil", "constitutional"],
    "accident_compensation": ["motor accident", "personal injury", "insurance", "tort"],
    "debt_financial": ["banking", "finance", "debt recovery", "civil"],
    "other": ["general practice", "civil"],
}


async def match_lawyers(case_info: dict, db_client=None) -> List[Dict[str, Any]]:
    """
    Match lawyers from the network based on case category and location.
    Tries real Supabase query first, falls back to empty list with guidance.
    """
    category = (case_info.get("category") or "other").lower()
    location = (case_info.get("location") or "").lower()
    specializations = CATEGORY_SPECIALIZATION_MAP.get(category, ["general practice"])

    if db_client:
        try:
            # Query verified lawyers from Supabase
            result = db_client.table("lawyer_profiles").select(
                "id,name,specialization,location,experience_years,languages,consultation_fee,"
                "is_verified,availability,bio"
            ).eq("is_verified", True).execute()

            all_lawyers = result.data or []

            # Score and rank lawyers
            scored = []
            for lawyer in all_lawyers:
                score = 0
                lawyer_spec = (lawyer.get("specialization") or "").lower()
                lawyer_loc = (lawyer.get("location") or "").lower()

                # Specialization match
                for spec in specializations:
                    if spec in lawyer_spec:
                        score += 3

                # Location match
                if location and location in lawyer_loc:
                    score += 2
                elif location and any(part in lawyer_loc for part in location.split()):
                    score += 1

                # Experience boost
                exp = lawyer.get("experience_years") or 0
                if exp > 10:
                    score += 2
                elif exp > 5:
                    score += 1

                if score > 0:
                    scored.append((score, lawyer))

            scored.sort(key=lambda x: x[0], reverse=True)
            matched = [l for _, l in scored[:3]]

            if matched:
                return matched

        except Exception as e:
            logger.error(f"Supabase lawyer query failed: {e}")

    # Return informative fallback — no fabricated data
    logger.info("[lawyer_matcher] No DB match found, returning guidance")
    return []


def format_lawyer_message(lawyers: List[Dict[str, Any]], case_info: dict, eligible_for_aid: bool = False) -> str:
    """Format lawyer suggestions as a chat message."""
    category = (case_info.get("category") or "your legal matter").replace("_", " ").title()

    if eligible_for_aid:
        intro = (
            f"While you may be eligible for government legal aid, you also have the option to "
            f"consult a lawyer from the Legal Saathi network for a second opinion or paid representation."
        )
    else:
        intro = (
            f"Based on your {category} case, here are lawyers from the Legal Saathi network "
            f"who may be able to help:"
        )

    lines = [intro, ""]

    if not lawyers:
        lines.extend([
            "⚠️ *No matching lawyers were found in our network for your location and case type at this time.*",
            "",
            "**What you can do:**",
            "• Contact the Bar Council of your state to find a local advocate.",
            "• Visit the Supreme Court Bar Association or your High Court bar association website.",
            "• Search for lawyers on the Bar Council of India portal: **https://barcouncilofindia.org**",
            "• Consider Lok Adalat for faster, cost-free dispute resolution if your case qualifies.",
        ])
        return "\n".join(lines)

    for i, lawyer in enumerate(lawyers, 1):
        lines.append(f"### Option {i}: {lawyer.get('name', 'Advocate')}")
        if lawyer.get("specialization"):
            lines.append(f"**Specialization:** {lawyer['specialization']}")
        if lawyer.get("location"):
            lines.append(f"**Location:** {lawyer['location']}")
        if lawyer.get("experience_years"):
            lines.append(f"**Experience:** {lawyer['experience_years']} years")
        if lawyer.get("languages"):
            lines.append(f"**Languages:** {lawyer['languages']}")
        if lawyer.get("consultation_fee"):
            lines.append(f"**Consultation:** ₹{lawyer['consultation_fee']}")
        if lawyer.get("availability"):
            lines.append(f"**Availability:** {lawyer['availability']}")
        if lawyer.get("bio"):
            lines.append(f"*{lawyer['bio'][:150]}...*" if len(lawyer.get("bio", "")) > 150 else f"*{lawyer.get('bio', '')}*")
        lines.append("")

    lines.extend([
        "⚠️ *Nyaya AI does not guarantee lawyer quality or outcomes. Always conduct your own due diligence before engaging a lawyer.*",
    ])
    return "\n".join(lines)
