import requests
import json
import sys
import uuid

API_URL = "http://127.0.0.1:8000"

def step(name):
    print(f"\n--- STEP: {name} ---")

def smoke_test():
    try:
        # Check health
        res = requests.get(f"{API_URL}/health")
        print("Backend Status:", res.json())
        
        step("1. Legal Chat")
        payload = {"question": "What are my rights if my landlord locks me out?"}
        res = requests.post(f"{API_URL}/chat/", json=payload)
        chat_ans = res.json().get("answer", "")[:100].encode('ascii', 'ignore').decode()
        print("Chat Response:", chat_ans + "...")
        
        step("2. Cluster Case Filing")
        tenant_id = str(uuid.uuid4())
        cluster_payload = {
            "cluster_id": "lockout_incident_001",
            "case_ids": ["case_991", "case_992"],
            "complaint_text": "Landlord unlawfully locked us out without notice",
            "cluster_embedding": [0.1] * 384
        }
        res = requests.post(f"{API_URL}/collective-actions/plan", json=cluster_payload, headers={"tenant-id": tenant_id})
        plan = res.json()["plan"]
        print("Cluster Strategy Generated:", plan.get("strategy").encode('ascii', 'ignore').decode())
        
        step("3. DLSA Eligibility")
        dlsa_payload = {
            "income": 100000,
            "caste_category": "general",
            "gender": "female",
            "disability": False,
            "senior_citizen": False,
            "custody": False,
            "victim_of_trafficking": False,
            "industrial_workman": False
        }
        res = requests.post(f"{API_URL}/legal-aid/evaluate", json=dlsa_payload)
        dlsa_res = res.json()
        print("DLSA Eligible?", dlsa_res["eligible"])
        print("Next Steps:", dlsa_res["next_steps"].encode('ascii', 'ignore').decode())
        
        step("4. Lawyer Network Fallback")
        dlsa_payload["income"] = 900000 # High income, no DLSA
        res = requests.post(f"{API_URL}/legal-aid/evaluate", json=dlsa_payload)
        dlsa_res_ineligible = res.json()
        print("DLSA Eligible (High Income)?", dlsa_res_ineligible["eligible"])
        print("Next Steps:", dlsa_res_ineligible["next_steps"].encode('ascii', 'ignore').decode())
        
        step("5. RTI Generator")
        rti_payload = {
            "department": "Police",
            "public_authority": "DCP",
            "information_required": "Number of unlawful eviction FIRs",
            "applicant_name": "Tenant",
            "language": "en"
        }
        res = requests.post(f"{API_URL}/rti/generate", json=rti_payload)
        rti_ans = res.json()["application"][:150].encode('ascii', 'ignore').decode()
        print("RTI Document Drafted:\n", rti_ans, "...\n")
        
        print("\n[PASS] SMOKE TEST PASSED: Core Hackathon Journey is functional.")
    except Exception as e:
        print(f"\n[FAIL] SMOKE TEST FAILED: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    smoke_test()
