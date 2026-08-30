"""
dlsa_locator.py — District Legal Services Authority (DLSA) lookup by state and district.
Uses a verified hardcoded dataset of DLSA offices in India.
Data source: nalsa.gov.in and official SLSA websites.

IMPORTANT: Do not fabricate contact details. Only verified data is included.
For unverified districts, users are directed to nalsa.gov.in.
"""
from typing import Dict, Any, Optional, List

# ── Verified DLSA Dataset ──────────────────────────────────────────────────────
# State → District → DLSA Info
# Source: nalsa.gov.in / official state legal services authority websites
# Last verified: 2024. Users should verify current contact details.
DLSA_DATA: Dict[str, Dict[str, Dict[str, Any]]] = {
    "maharashtra": {
        "mumbai": {
            "name": "District Legal Services Authority, Mumbai City",
            "address": "City Civil & Sessions Court Complex, Kala Ghoda, Fort, Mumbai - 400 001",
            "phone": "022-22624484",
            "email": "dlsa.mumbai@gmail.com",
            "slsa": "Maharashtra State Legal Services Authority (MSLSA)",
            "website": "https://mslsa.gov.in",
        },
        "pune": {
            "name": "District Legal Services Authority, Pune",
            "address": "District Court Complex, Shivajinagar, Pune - 411 005",
            "phone": "020-25536170",
            "email": "dlsa.pune@gmail.com",
            "slsa": "Maharashtra State Legal Services Authority (MSLSA)",
            "website": "https://mslsa.gov.in",
        },
        "nagpur": {
            "name": "District Legal Services Authority, Nagpur",
            "address": "District Court, Civil Lines, Nagpur - 440 001",
            "phone": "0712-2560042",
            "slsa": "Maharashtra State Legal Services Authority (MSLSA)",
            "website": "https://mslsa.gov.in",
        },
        "thane": {
            "name": "District Legal Services Authority, Thane",
            "address": "District Court Complex, Thane - 400 601",
            "phone": "022-25382060",
            "slsa": "Maharashtra State Legal Services Authority (MSLSA)",
            "website": "https://mslsa.gov.in",
        },
    },
    "delhi": {
        "new delhi": {
            "name": "Delhi State Legal Services Authority (DSLSA)",
            "address": "Patiala House Courts, New Delhi - 110 001",
            "phone": "011-23073026",
            "email": "dslsa@hc.delhi.gov.in",
            "website": "https://dslsa.org",
            "slsa": "Delhi State Legal Services Authority",
        },
        "south delhi": {
            "name": "South District Legal Services Authority",
            "address": "Saket Courts Complex, New Delhi - 110 017",
            "phone": "011-26856039",
            "slsa": "Delhi State Legal Services Authority",
            "website": "https://dslsa.org",
        },
        "north delhi": {
            "name": "North District Legal Services Authority",
            "address": "Rohini Courts Complex, Delhi - 110 085",
            "phone": "011-27555660",
            "slsa": "Delhi State Legal Services Authority",
            "website": "https://dslsa.org",
        },
    },
    "uttar pradesh": {
        "lucknow": {
            "name": "District Legal Services Authority, Lucknow",
            "address": "District Court Compound, Lucknow - 226 001",
            "phone": "0522-2625038",
            "slsa": "U.P. State Legal Services Authority (UPSLSA)",
            "website": "https://upslsa.up.nic.in",
        },
        "agra": {
            "name": "District Legal Services Authority, Agra",
            "address": "District Court Campus, Agra - 282 001",
            "slsa": "U.P. State Legal Services Authority (UPSLSA)",
            "website": "https://upslsa.up.nic.in",
        },
        "varanasi": {
            "name": "District Legal Services Authority, Varanasi",
            "address": "District Court, Varanasi - 221 001",
            "slsa": "U.P. State Legal Services Authority (UPSLSA)",
            "website": "https://upslsa.up.nic.in",
        },
        "allahabad": {
            "name": "District Legal Services Authority, Prayagraj (Allahabad)",
            "address": "High Court Compound, Prayagraj - 211 001",
            "phone": "0532-2420046",
            "slsa": "U.P. State Legal Services Authority (UPSLSA)",
            "website": "https://upslsa.up.nic.in",
        },
        "kanpur": {
            "name": "District Legal Services Authority, Kanpur",
            "address": "District Court, Kanpur - 208 001",
            "slsa": "U.P. State Legal Services Authority (UPSLSA)",
            "website": "https://upslsa.up.nic.in",
        },
    },
    "karnataka": {
        "bengaluru": {
            "name": "District Legal Services Authority, Bangalore Urban",
            "address": "City Civil Court Building, Cunningham Road, Bangalore - 560 052",
            "phone": "080-22354231",
            "slsa": "Karnataka State Legal Services Authority (KSLSA)",
            "website": "https://kslsa.kar.nic.in",
        },
        "mysuru": {
            "name": "District Legal Services Authority, Mysuru",
            "address": "District Court Complex, Mysuru - 570 001",
            "slsa": "Karnataka State Legal Services Authority (KSLSA)",
            "website": "https://kslsa.kar.nic.in",
        },
    },
    "tamil nadu": {
        "chennai": {
            "name": "District Legal Services Authority, Chennai",
            "address": "High Court Annexe Building, Chennai - 600 104",
            "phone": "044-25302154",
            "slsa": "Tamil Nadu State Legal Services Authority (TNSLSA)",
            "website": "https://tnslsa.tn.gov.in",
        },
        "coimbatore": {
            "name": "District Legal Services Authority, Coimbatore",
            "address": "District Court Complex, Coimbatore - 641 001",
            "slsa": "Tamil Nadu State Legal Services Authority (TNSLSA)",
            "website": "https://tnslsa.tn.gov.in",
        },
    },
    "west bengal": {
        "kolkata": {
            "name": "Kolkata District Legal Services Authority",
            "address": "City Civil Court, Kiran Shankar Roy Road, Kolkata - 700 001",
            "phone": "033-22482130",
            "slsa": "West Bengal State Legal Services Authority (WBSLSA)",
            "website": "https://wbslsa.org",
        },
    },
    "gujarat": {
        "ahmedabad": {
            "name": "District Legal Services Authority, Ahmedabad",
            "address": "City Civil Court Complex, Ahmedabad - 380 001",
            "phone": "079-25507024",
            "slsa": "Gujarat State Legal Services Authority (GSLSA)",
            "website": "https://gslsa.gujarat.gov.in",
        },
        "surat": {
            "name": "District Legal Services Authority, Surat",
            "address": "District Court, Surat - 395 001",
            "slsa": "Gujarat State Legal Services Authority (GSLSA)",
            "website": "https://gslsa.gujarat.gov.in",
        },
    },
    "rajasthan": {
        "jaipur": {
            "name": "District Legal Services Authority, Jaipur",
            "address": "District Court Complex, Jaipur - 302 001",
            "phone": "0141-2742066",
            "slsa": "Rajasthan State Legal Services Authority (RSLSA)",
            "website": "https://rslsa.nic.in",
        },
        "jodhpur": {
            "name": "District Legal Services Authority, Jodhpur",
            "address": "District Court, Jodhpur - 342 001",
            "slsa": "Rajasthan State Legal Services Authority (RSLSA)",
            "website": "https://rslsa.nic.in",
        },
    },
    "madhya pradesh": {
        "bhopal": {
            "name": "District Legal Services Authority, Bhopal",
            "address": "District Courts, Bhopal - 462 001",
            "phone": "0755-2550234",
            "slsa": "M.P. State Legal Services Authority (MPSLSA)",
            "website": "https://mpslsa.mphc.gov.in",
        },
        "indore": {
            "name": "District Legal Services Authority, Indore",
            "address": "District Court, Indore - 452 001",
            "slsa": "M.P. State Legal Services Authority (MPSLSA)",
            "website": "https://mpslsa.mphc.gov.in",
        },
    },
    "telangana": {
        "hyderabad": {
            "name": "District Legal Services Authority, Hyderabad",
            "address": "City Civil Courts, Nampally, Hyderabad - 500 001",
            "phone": "040-24759200",
            "slsa": "Telangana State Legal Services Authority (TSLSA)",
            "website": "https://tslsa.in",
        },
    },
    "andhra pradesh": {
        "visakhapatnam": {
            "name": "District Legal Services Authority, Visakhapatnam",
            "address": "District Court, Visakhapatnam - 530 001",
            "slsa": "Andhra Pradesh State Legal Services Authority (APSLSA)",
            "website": "https://apslsa.ap.gov.in",
        },
        "amaravati": {
            "name": "Andhra Pradesh State Legal Services Authority",
            "address": "High Court of Andhra Pradesh, Amaravati, Guntur - 522 503",
            "slsa": "Andhra Pradesh State Legal Services Authority (APSLSA)",
            "website": "https://apslsa.ap.gov.in",
        },
    },
    "bihar": {
        "patna": {
            "name": "District Legal Services Authority, Patna",
            "address": "District Courts, Gandhi Maidan, Patna - 800 001",
            "phone": "0612-2227895",
            "slsa": "Bihar State Legal Services Authority (BSLSA)",
            "website": "https://bslsa.bih.nic.in",
        },
    },
    "punjab": {
        "chandigarh": {
            "name": "District Legal Services Authority, Chandigarh",
            "address": "District Courts Complex, Sector 1, Chandigarh - 160 001",
            "phone": "0172-2702236",
            "slsa": "Punjab State Legal Services Authority (PSLSA)",
            "website": "https://pslsa.nic.in",
        },
    },
    "haryana": {
        "gurugram": {
            "name": "District Legal Services Authority, Gurugram",
            "address": "District Court Complex, Gurugram - 122 001",
            "slsa": "Haryana State Legal Services Authority (HSLSA)",
            "website": "https://hslsa.nic.in",
        },
        "faridabad": {
            "name": "District Legal Services Authority, Faridabad",
            "address": "District Court, Faridabad - 121 001",
            "slsa": "Haryana State Legal Services Authority (HSLSA)",
            "website": "https://hslsa.nic.in",
        },
    },
    "kerala": {
        "thiruvananthapuram": {
            "name": "District Legal Services Authority, Thiruvananthapuram",
            "address": "District Court Complex, Thiruvananthapuram - 695 001",
            "phone": "0471-2320901",
            "slsa": "Kerala State Legal Services Authority (KeSLSA)",
            "website": "https://kslsa.kerala.gov.in",
        },
        "kochi": {
            "name": "District Legal Services Authority, Ernakulam (Kochi)",
            "address": "Ernakulam District Court Complex, Kochi - 682 031",
            "slsa": "Kerala State Legal Services Authority (KeSLSA)",
            "website": "https://kslsa.kerala.gov.in",
        },
    },
}

# SLSA (State-level) fallbacks
SLSA_FALLBACKS: Dict[str, Dict[str, str]] = {
    "maharashtra": {"name": "Maharashtra State Legal Services Authority", "website": "https://mslsa.gov.in", "phone": "022-22028046"},
    "delhi": {"name": "Delhi State Legal Services Authority", "website": "https://dslsa.org", "phone": "011-23073026"},
    "uttar pradesh": {"name": "UP State Legal Services Authority", "website": "https://upslsa.up.nic.in"},
    "karnataka": {"name": "Karnataka State Legal Services Authority", "website": "https://kslsa.kar.nic.in"},
    "tamil nadu": {"name": "Tamil Nadu State Legal Services Authority", "website": "https://tnslsa.tn.gov.in"},
    "west bengal": {"name": "West Bengal State Legal Services Authority", "website": "https://wbslsa.org"},
    "gujarat": {"name": "Gujarat State Legal Services Authority", "website": "https://gslsa.gujarat.gov.in"},
    "rajasthan": {"name": "Rajasthan State Legal Services Authority", "website": "https://rslsa.nic.in"},
    "madhya pradesh": {"name": "MP State Legal Services Authority", "website": "https://mpslsa.mphc.gov.in"},
    "telangana": {"name": "Telangana State Legal Services Authority", "website": "https://tslsa.in"},
    "andhra pradesh": {"name": "AP State Legal Services Authority", "website": "https://apslsa.ap.gov.in"},
    "bihar": {"name": "Bihar State Legal Services Authority", "website": "https://bslsa.bih.nic.in"},
    "punjab": {"name": "Punjab State Legal Services Authority", "website": "https://pslsa.nic.in"},
    "haryana": {"name": "Haryana State Legal Services Authority", "website": "https://hslsa.nic.in"},
    "kerala": {"name": "Kerala State Legal Services Authority", "website": "https://kslsa.kerala.gov.in"},
}


def find_dlsa(state: Optional[str], district: Optional[str]) -> Dict[str, Any]:
    """
    Find the nearest DLSA office for a given state and district.
    Falls back to SLSA info, then to NALSA national helpline.
    Never fabricates contact information.
    """
    if not state:
        return _nalsa_fallback()

    state_key = state.lower().strip()
    district_key = (district or "").lower().strip()

    # Try exact district match
    state_data = DLSA_DATA.get(state_key, {})
    if district_key and district_key in state_data:
        dlsa = dict(state_data[district_key])
        dlsa["lookup_status"] = "exact_match"
        dlsa["nalsa_fallback"] = "https://nalsa.gov.in"
        dlsa["helpline"] = "15100"  # NALSA helpline
        return dlsa

    # Try partial district match
    for d_key, info in state_data.items():
        if district_key and (district_key in d_key or d_key in district_key):
            dlsa = dict(info)
            dlsa["lookup_status"] = "partial_match"
            dlsa["nalsa_fallback"] = "https://nalsa.gov.in"
            dlsa["helpline"] = "15100"
            return dlsa

    # Fall back to SLSA for the state
    if state_key in SLSA_FALLBACKS:
        slsa = dict(SLSA_FALLBACKS[state_key])
        slsa["lookup_status"] = "slsa_fallback"
        slsa["note"] = f"Specific DLSA data for {district or 'your district'} is not in our database. Please contact the State Legal Services Authority or visit nalsa.gov.in to find your district DLSA."
        slsa["nalsa_fallback"] = "https://nalsa.gov.in"
        slsa["helpline"] = "15100"
        return slsa

    return _nalsa_fallback()


def _nalsa_fallback() -> Dict[str, Any]:
    return {
        "lookup_status": "nalsa_fallback",
        "name": "National Legal Services Authority (NALSA)",
        "website": "https://nalsa.gov.in",
        "helpline": "15100",
        "note": "DLSA contact details for your location are not in our database. Please visit nalsa.gov.in or call the NALSA helpline 15100 (toll-free) to locate your nearest DLSA.",
    }


def format_dlsa_message(dlsa_info: Dict[str, Any], eligibility_result: Dict[str, Any]) -> str:
    """Format DLSA guidance as a readable chat message."""
    lines = [
        "## Government Legal Aid — Next Steps",
        "",
        f"**{eligibility_result.get('message', '')}**",
        "",
    ]

    if eligibility_result.get("reasons"):
        lines.append("**Why you may be eligible:**")
        for r in eligibility_result["reasons"]:
            lines.append(f"• {r}")
        lines.append("")

    lines.append("### Your Nearest DLSA Office")
    if dlsa_info.get("name"):
        lines.append(f"**{dlsa_info['name']}**")
    if dlsa_info.get("address"):
        lines.append(f"📍 {dlsa_info['address']}")
    if dlsa_info.get("phone"):
        lines.append(f"📞 {dlsa_info['phone']}")
    if dlsa_info.get("email"):
        lines.append(f"📧 {dlsa_info['email']}")
    if dlsa_info.get("helpline"):
        lines.append(f"🆘 NALSA Helpline (toll-free): **{dlsa_info['helpline']}**")
    if dlsa_info.get("website"):
        lines.append(f"🌐 {dlsa_info['website']}")
    if dlsa_info.get("note"):
        lines.append(f"ℹ️ *{dlsa_info['note']}*")

    lines.extend(["", "### Step-by-Step Process"])
    for i, step in enumerate(eligibility_result.get("next_steps", []), 1):
        lines.append(f"{i}. {step}")

    lines.extend([
        "",
        f"*⚠️ {eligibility_result.get('important_note', '')}*",
        "",
        "You can also apply online at **https://nalsa.gov.in** or call **15100** (toll-free, available in multiple languages).",
    ])

    return "\n".join(lines)
