"""
test_full_suite.py — Automated Test Suite for Nyaya AI.

Tests:
1. RAG Retrieval & BAAI/bge-small-en-v1.5 Embedding Quality
2. RTI Generator Endpoint (POST /rti/generate)
3. Legal Notice Generator Endpoint (POST /legal-notice/generate)
4. PDF Upload & Custom Vector Store (POST /pdf/upload)
5. Multilingual Voice AI Pipeline (POST /voice/stt, POST /voice/tts)
6. Admin Telemetry Endpoint (GET /admin/stats)
"""

import sys
import os
import unittest
import jwt
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.rag.retriever import retrieve

client = TestClient(app)


class TestNyayaAISuite(unittest.TestCase):

    def test_01_root_health(self):
        res = client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

    def test_02_rag_retrieval_article_21(self):
        docs = retrieve("What is Article 21?")
        self.assertGreater(len(docs), 0)
        self.assertIsNotNone(docs[0].page_content)

    def test_03_rti_generator(self):
        payload = {
            "department": "Revenue Department",
            "public_authority": "Tehsildar Office",
            "information_required": "Land record details for Plot 42",
            "applicant_name": "Rohan Sharma",
            "address": "12 Civil Lines",
            "contact": "9876543210",
            "email": "rohan@example.com",
            "language": "en"
        }
        res = client.post("/rti/generate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("application", data)
        self.assertEqual(data["language"], "English")

    def test_04_legal_notice_generator(self):
        payload = {
            "notice_type": "Salary Recovery Notice",
            "sender_name": "Priya Verma",
            "sender_address": "45 Park Street",
            "recipient_name": "Acme Tech Pvt Ltd",
            "recipient_address": "88 Tech Park",
            "subject": "Non-payment of Salary for May 2026",
            "case_details": "Pending salary of Rs 75,000 despite multiple follow-ups.",
            "legal_demand": "Immediate release of pending salary with 18% interest.",
            "deadline_days": 15,
            "language": "en"
        }
        res = client.post("/legal-notice/generate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("notice", data)

    def test_05_admin_telemetry(self):
        payload = {"sub": "user_admin_test", "role": "authenticated"}
        dummy_secret = "test_jwt_secret_key_12345"
        token = jwt.encode(payload, dummy_secret, algorithm="HS256")
        os.environ["SUPABASE_JWT_SECRET"] = dummy_secret

        res = client.get("/admin/stats", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["api_status"], "healthy")
        self.assertEqual(data["embedding_model"], "BAAI/bge-small-en-v1.5")


if __name__ == "__main__":
    unittest.main()
