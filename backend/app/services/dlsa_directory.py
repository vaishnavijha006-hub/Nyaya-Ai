"""
dlsa_directory.py — District Legal Services Authority (DLSA) Directory and Search Service.
Maps Indian states and districts to official DLSA offices, helpline numbers, addresses, and portals.
"""

from typing import Dict, Any, Optional, List

# National Legal Services Authority (NALSA) Constant Details
NALSA_HELPLINE = "15100"
NALSA_PORTAL = "https://nalsa.gov.in"

DLSA_DATABASE: Dict[str, Dict[str, Any]] = {
    "delhi": {
        "state": "Delhi",
        "slsa_name": "Delhi State Legal Services Authority (DSLSA)",
        "slsa_portal": "https://dslsa.org",
        "districts": {
            "central": {
                "name": "DLSA Central (Tis Hazari Courts)",
                "address": "Room No. 288, 2nd Floor, Tis Hazari Courts, Delhi - 110054",
                "phone": "011-23968015",
                "email": "central-dlsa@nic.in"
            },
            "south": {
                "name": "DLSA South (Saket Courts)",
                "address": "Administrative Block, Saket Court Complex, New Delhi - 110017",
                "phone": "011-29562624",
                "email": "south-dlsa@nic.in"
            },
            "new delhi": {
                "name": "DLSA New Delhi (Patiala House Courts)",
                "address": "Patiala House Courts Complex, New Delhi - 110001",
                "phone": "011-23384781",
                "email": "ndlsa-phc@nic.in"
            },
            "default": {
                "name": "Delhi State Legal Services Authority HQ",
                "address": "3rd Floor, Rouse Avenue District Court Complex, Pt. Deen Dayal Upadhyaya Marg, New Delhi - 110002",
                "phone": "011-23384781",
                "email": "dslsa-phc@nic.in"
            }
        }
    },
    "uttar pradesh": {
        "state": "Uttar Pradesh",
        "slsa_name": "UP State Legal Services Authority (UPSLSA)",
        "slsa_portal": "http://upslsa.up.nic.in",
        "districts": {
            "ghaziabad": {
                "name": "DLSA Ghaziabad",
                "address": "District Court Compound, Raj Nagar, Ghaziabad, UP - 201002",
                "phone": "0120-2820844",
                "email": "dlsa.ghaziabad@gmail.com"
            },
            "gautam buddh nagar": {
                "name": "DLSA Gautam Buddh Nagar (Noida)",
                "address": "District Court Complex, Surajpur, Greater Noida, UP - 201306",
                "phone": "0120-2350811",
                "email": "dlsa.gbnagar@gmail.com"
            },
            "noida": {
                "name": "DLSA Gautam Buddh Nagar (Noida)",
                "address": "District Court Complex, Surajpur, Greater Noida, UP - 201306",
                "phone": "0120-2350811",
                "email": "dlsa.gbnagar@gmail.com"
            },
            "lucknow": {
                "name": "DLSA Lucknow",
                "address": "District & Sessions Court Compound, Hazratganj, Lucknow, UP - 226001",
                "phone": "0522-2621944",
                "email": "dlsa.lucknow@gmail.com"
            },
            "default": {
                "name": "UP State Legal Services Authority HQ",
                "address": "High Court Building, Jawahar Lal Nehru Marg, Lucknow, UP - 226001",
                "phone": "0522-2286396",
                "email": "upslsa@nic.in"
            }
        }
    },
    "maharashtra": {
        "state": "Maharashtra",
        "slsa_name": "Maharashtra State Legal Services Authority (MSLSA)",
        "slsa_portal": "https://legalservices.maharashtra.gov.in",
        "districts": {
            "mumbai": {
                "name": "DLSA Mumbai City",
                "address": "City Civil & Sessions Court Building, Fort, Mumbai - 400032",
                "phone": "022-22670783",
                "email": "dlsa.mumbai@maharashtra.gov.in"
            },
            "pune": {
                "name": "DLSA Pune",
                "address": "New District Court Building, Shivajinagar, Pune - 411005",
                "phone": "020-25530733",
                "email": "dlsa.pune@maharashtra.gov.in"
            },
            "default": {
                "name": "Maharashtra State Legal Services Authority HQ",
                "address": "High Court PWD Building, Fort, Mumbai - 400032",
                "phone": "022-22670783",
                "email": "mslsa-hc@nic.in"
            }
        }
    },
    "karnataka": {
        "state": "Karnataka",
        "slsa_name": "Karnataka State Legal Services Authority (KSLSA)",
        "slsa_portal": "https://kslsa.kar.nic.in",
        "districts": {
            "bengaluru": {
                "name": "DLSA Bengaluru Urban",
                "address": "City Civil Court Complex, KG Road, Bengaluru - 560001",
                "phone": "080-22216503",
                "email": "dlsa.bengaluru@kar.nic.in"
            },
            "bangalore": {
                "name": "DLSA Bengaluru Urban",
                "address": "City Civil Court Complex, KG Road, Bengaluru - 560001",
                "phone": "080-22216503",
                "email": "dlsa.bengaluru@kar.nic.in"
            },
            "default": {
                "name": "Karnataka State Legal Services Authority HQ",
                "address": "Nyaya Degula, 1st Floor, H. Siddaiah Road, Bengaluru - 560027",
                "phone": "080-22111714",
                "email": "kslsa.kar@nic.in"
            }
        }
    }
}


def get_nearest_dlsa(state: Optional[str] = None, district: Optional[str] = None) -> Dict[str, Any]:
    """
    Lookup nearest DLSA office details based on state and district.
    Falls back gracefully to state HQ or National Legal Aid helpline.
    """
    state_key = (state or "").lower().strip()
    district_key = (district or "").lower().strip()

    state_info = DLSA_DATABASE.get(state_key)
    
    if not state_info:
        # Try matching state substring
        for k, v in DLSA_DATABASE.items():
            if k in state_key or state_key in k:
                state_info = v
                break

    if state_info:
        districts_map = state_info.get("districts", {})
        district_info = districts_map.get(district_key)
        if not district_info:
            for dk, dv in districts_map.items():
                if dk in district_key or district_key in dk:
                    district_info = dv
                    break
        
        if not district_info:
            district_info = districts_map.get("default", {
                "name": f"{state_info['state']} DLSA Head Office",
                "address": f"District & Sessions Court, {state_info['state']}",
                "phone": NALSA_HELPLINE,
                "email": "help@nalsa.gov.in"
            })

        return {
            "found": True,
            "state": state_info["state"],
            "slsa_name": state_info["slsa_name"],
            "slsa_portal": state_info["slsa_portal"],
            "dlsa_name": district_info["name"],
            "address": district_info["address"],
            "phone": district_info.get("phone", NALSA_HELPLINE),
            "email": district_info.get("email", "nalsa-dla@nic.in"),
            "nalsa_helpline": NALSA_HELPLINE,
            "nalsa_portal": NALSA_PORTAL,
            "how_to_apply": [
                "Step 1: Gather ID proof (Aadhaar/Voter ID), Income/Category Certificate, and case files.",
                "Step 2: Visit DLSA Front Office at District Court OR apply online at https://nalsa.gov.in OR call 15100.",
                "Step 3: Submit free Prescribed Application Form A (Zero fee charged).",
                "Step 4: DLSA Secretary reviews application and assigns a free Panel Advocate.",
                "Step 5: Meet assigned Panel Lawyer and track case progress via DLSA tracking ID."
            ],
            "how_to_apply_steps": [
                {
                    "step": 1,
                    "title": "Document Checklist Preparation",
                    "description": "Keep Aadhaar/Voter ID, Income Certificate (if claiming under income) or SC/ST Category Certificate, and case files (FIR/Notice/Agreement) ready."
                },
                {
                    "step": 2,
                    "title": "Select Application Mode",
                    "description": "Choose Option A (Visit DLSA Front Office at District Court), Option B (Apply Online at nalsa.gov.in), or Option C (Call Toll-Free Helpline 15100)."
                },
                {
                    "step": 3,
                    "title": "Fill Free Prescribed Application (Form A)",
                    "description": "Fill out the simple legal aid application form provided free of charge. No court fees or application fees are charged."
                },
                {
                    "step": 4,
                    "title": "Scrutiny & Free Advocate Assignment",
                    "description": "The DLSA Secretary evaluates your application within 3-7 days and assigns a free Legal Aid Panel Advocate to represent you."
                },
                {
                    "step": 5,
                    "title": "Meet Assigned Lawyer & Track Case",
                    "description": "Meet your appointed lawyer, share document copies, and monitor your case status via the DLSA application tracking ID."
                }
            ]
        }

    # Default fallback
    return {
        "found": False,
        "state": state or "India",
        "slsa_name": "National Legal Services Authority (NALSA)",
        "slsa_portal": NALSA_PORTAL,
        "dlsa_name": f"District Legal Services Authority ({district or 'Local District Court'})",
        "address": "Front Office, District & Sessions Court Complex, Local District Headquarters",
        "phone": NALSA_HELPLINE,
        "email": "nalsa-dla@nic.in",
        "nalsa_helpline": NALSA_HELPLINE,
        "nalsa_portal": NALSA_PORTAL,
        "how_to_apply": [
            "Step 1: Visit the Legal Aid Front Office at your nearest District Court.",
            "Step 2: Call National Legal Aid Helpline 15100 for immediate assistance.",
            "Step 3: Apply online at https://nalsa.gov.in."
        ],
        "how_to_apply_steps": [
            {
                "step": 1,
                "title": "Document Checklist Preparation",
                "description": "Keep Aadhaar/Voter ID, Income Certificate or Category Certificate, and case files ready."
            },
            {
                "step": 2,
                "title": "Contact Legal Aid Front Office or Helpline",
                "description": "Visit the Front Office at District Court, call Toll-Free 15100, or apply online at nalsa.gov.in."
            },
            {
                "step": 3,
                "title": "Submit Application Form",
                "description": "Submit the free prescribed form. No court fees are required."
            },
            {
                "step": 4,
                "title": "Panel Advocate Assignment",
                "description": "DLSA assigns a free government panel lawyer to handle your legal case."
            }
        ]
    }
