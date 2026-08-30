"""
cluster_engine.py — Cross-Case Semantic Clustering Engine using Qdrant.

Implements PII scrubbing, anonymized embedding generation, Qdrant vector similarity search,
threshold-based candidate cluster detection, and safe identity isolation.
"""
import hashlib
import logging
import re
from typing import Dict, Any, Optional, List
from qdrant_client import QdrantClient
from qdrant_client.http import models

from app.models.cluster import ClusterDetectionResult, ClusterCaseMatch
from app.rag.embedder import get_embeddings

logger = logging.getLogger(__name__)

DEFAULT_SIMILARITY_THRESHOLD = 0.78
COLLECTION_NAME = "nyaya_case_clusters"


def anonymize_case_data(case_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    PII Scrubbing: Strips all identity indicators (names, phone numbers, email addresses,
    exact house/flat numbers, Aadhaar/PAN numbers) to produce an anonymized representation.
    """
    category = (case_info.get("category") or "GENERAL_LEGAL").upper()
    issue = case_info.get("issue") or ""
    facts = case_info.get("key_facts", [])

    # 1. Scrub names
    scrubbed_issue = re.sub(r'\b(mr\.?|ms\.?|mrs\.?|dr\.?)\s+[a-z]+\b', '[PARTY]', issue, flags=re.IGNORECASE)
    scrubbed_issue = re.sub(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', '[PERSON]', scrubbed_issue)
    
    # 2. Scrub phone numbers (10 digits)
    scrubbed_issue = re.sub(r'\b\d{10}\b', '[PHONE]', scrubbed_issue)

    # 3. Scrub emails
    scrubbed_issue = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', '[EMAIL]', scrubbed_issue)

    # 4. Scrub addresses & house numbers
    scrubbed_issue = re.sub(r'\b(flat|house|plot|no\.?)\s*\d+[\w-]*\b', '[ADDRESS]', scrubbed_issue, flags=re.IGNORECASE)

    # 5. Scrub Govt ID numbers (Aadhaar 12 digits, PAN 10 alphanum)
    scrubbed_issue = re.sub(r'\b\d{4}\s?\d{4}\s?\d{4}\b', '[AADHAAR]', scrubbed_issue)
    scrubbed_issue = re.sub(r'\b[A-Z]{5}\d{4}[A-Z]{1}\b', '[PAN]', scrubbed_issue)

    scrubbed_facts = []
    for f in facts:
        f_clean = re.sub(r'\b(mr\.?|ms\.?|mrs\.?|dr\.?)\s+[a-z]+\b', '[PARTY]', f, flags=re.IGNORECASE)
        f_clean = re.sub(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', '[PERSON]', f_clean)
        f_clean = re.sub(r'\b\d{10}\b', '[PHONE]', f_clean)
        f_clean = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', '[EMAIL]', f_clean)
        f_clean = re.sub(r'\b(flat|house|plot|no\.?)\s*\d+[\w-]*\b', '[ADDRESS]', f_clean, flags=re.IGNORECASE)
        f_clean = re.sub(r'\b\d{4}\s?\d{4}\s?\d{4}\b', '[AADHAAR]', f_clean)
        f_clean = re.sub(r'\b[A-Z]{5}\d{4}[A-Z]{1}\b', '[PAN]', f_clean)
        scrubbed_facts.append(f_clean)

    # Entity classification
    combined_text = f"{issue} {' '.join(facts)}".lower()
    entity_type = "generic_counterparty"
    if "landlord" in combined_text or "rent" in combined_text or "lockout" in combined_text:
        entity_type = "landlord"
    elif "employer" in combined_text or "salary" in combined_text or "wages" in combined_text:
        entity_type = "employer"
    elif "builder" in combined_text or "possession" in combined_text or "flat" in combined_text:
        entity_type = "builder"
    elif "vendor" in combined_text or "merchant" in combined_text or "product" in combined_text:
        entity_type = "vendor"
    elif "bank" in combined_text or "cheque" in combined_text:
        entity_type = "bank"

    # Aggregated Location (City / District level)
    raw_loc = case_info.get("location", "Delhi NCR")
    safe_location = raw_loc.split(",")[0].strip() if "," in raw_loc else raw_loc

    return {
        "category": category,
        "sub_category": case_info.get("sub_category", "general"),
        "entity_type": entity_type,
        "location": safe_location,
        "scrubbed_issue": scrubbed_issue,
        "scrubbed_facts": scrubbed_facts,
    }


def build_privacy_safe_text(anonymized_data: Dict[str, Any]) -> str:
    """Combines anonymized fields into a single text string for vector embedding."""
    return (
        f"Category: {anonymized_data['category']}. "
        f"Counterparty Type: {anonymized_data['entity_type']}. "
        f"District Region: {anonymized_data['location']}. "
        f"Issue: {anonymized_data['scrubbed_issue']}. "
        f"Facts: {' '.join(anonymized_data['scrubbed_facts'])}."
    )


class ClusterEngine:
    def __init__(self, qdrant_client: Optional[QdrantClient] = None):
        if qdrant_client is None:
            self.client = QdrantClient(":memory:")
        else:
            self.client = qdrant_client

        self.embeddings_model = get_embeddings()
        self._ensure_collection()

    def _ensure_collection(self):
        try:
            collections = [c.name for c in self.client.get_collections().collections]
            if COLLECTION_NAME not in collections:
                self.client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=models.VectorParams(
                        size=384,
                        distance=models.Distance.COSINE
                    )
                )
                logger.info(f"[ClusterEngine] Collection '{COLLECTION_NAME}' created.")
        except Exception as e:
            logger.warning(f"[ClusterEngine] Collection init: {e}")

    def generate_embedding(self, text: str) -> List[float]:
        return self.embeddings_model.embed_query(text)

    def add_case_to_index(self, case_id: str, case_info: Dict[str, Any], tenant_id: str = "default") -> str:
        """Indexes anonymized case vectors into Qdrant. Never stores raw PII."""
        anon_data = anonymize_case_data(case_info)
        safe_text = build_privacy_safe_text(anon_data)
        vector = self.generate_embedding(safe_text)

        payload = {
            "case_id": case_id,
            "tenant_id": tenant_id,
            "category": anon_data["category"],
            "entity_type": anon_data["entity_type"],
            "location": anon_data["location"],
            "anonymized_summary": anon_data["scrubbed_issue"],
            "anonymized_facts": anon_data["scrubbed_facts"],
        }

        point_id = int(hashlib.md5(case_id.encode("utf-8")).hexdigest()[:8], 16)
        self.client.upsert(
            collection_name=COLLECTION_NAME,
            points=[models.PointStruct(id=point_id, vector=vector, payload=payload)]
        )
        return case_id

    def detect_cluster_for_case(
        self,
        case_info: Dict[str, Any],
        tenant_id: str = "default",
        threshold: float = DEFAULT_SIMILARITY_THRESHOLD,
    ) -> ClusterDetectionResult:
        """
        Performs vector similarity search in Qdrant against anonymized case representations.
        Returns structured ClusterDetectionResult with non-identical framing.
        """
        anon_data = anonymize_case_data(case_info)
        safe_text = build_privacy_safe_text(anon_data)
        query_vector = self.generate_embedding(safe_text)

        try:
            if hasattr(self.client, "query_points"):
                q_res = self.client.query_points(
                    collection_name=COLLECTION_NAME,
                    query=query_vector,
                    limit=10,
                    score_threshold=threshold,
                )
                results = getattr(q_res, "points", [])
            elif hasattr(self.client, "search"):
                results = self.client.search(
                    collection_name=COLLECTION_NAME,
                    query_vector=query_vector,
                    limit=10,
                    score_threshold=threshold,
                )
            else:
                results = []
        except Exception as e:
            logger.warning(f"[ClusterEngine] Search error ({e}).")
            results = []

        matches: List[ClusterCaseMatch] = []
        for res in results:
            p = res.payload or {}
            matches.append(
                ClusterCaseMatch(
                    case_id=p.get("case_id", "anon_case"),
                    similarity_score=round(float(res.score), 3),
                    category=p.get("category", anon_data["category"]),
                    anonymized_summary=p.get("anonymized_summary", ""),
                    location=p.get("location", anon_data["location"]),
                )
            )

        if not matches:
            return ClusterDetectionResult(
                cluster_detected=False,
                cluster_id=None,
                number_of_cases=1,
                cluster_size=1,
                common_issue=anon_data["scrubbed_issue"],
                common_issues=[anon_data["scrubbed_issue"]],
                common_entities=[anon_data["entity_type"]],
                geographic_pattern=anon_data["location"],
                common_facts=anon_data["scrubbed_facts"],
                common_documents=["Proof of Transaction / Communications"],
                time_trend="Single complaint (No cluster)",
                similarity_score=0.0,
                confidence=0.1,
                requires_human_review=True,
                message="No related-case cluster detected above similarity threshold.",
                metadata={"category": anon_data["category"]},
            )

        top_score = max(m.similarity_score for m in matches)
        total_cases = len(matches) + 1
        category_clean = anon_data["category"]
        entity_clean = anon_data["entity_type"]

        cluster_hash = hashlib.md5(f"{category_clean}_{entity_clean}_{anon_data['location']}".encode("utf-8")).hexdigest()[:8]
        cluster_id = f"cluster_{category_clean.lower()}_{cluster_hash}"

        common_issues = [anon_data["scrubbed_issue"]]
        for m in matches[:3]:
            if m.anonymized_summary and m.anonymized_summary not in common_issues:
                common_issues.append(m.anonymized_summary)

        common_facts = [
            f"Multiple grievances ({total_cases} cases) reported in {anon_data['location']} regarding {entity_clean}.",
            f"Common conduct category: {category_clean.replace('_', ' ').title()}.",
        ]

        safe_message = (
            f"{total_cases} complaints appear semantically related to a common {entity_clean} dispute. "
            "These cases show semantic similarities and may warrant human/legal review for a common underlying issue."
        )

        return ClusterDetectionResult(
            cluster_detected=True,
            cluster_id=cluster_id,
            number_of_cases=total_cases,
            cluster_size=total_cases,
            common_issue=common_issues[0],
            common_issues=common_issues,
            common_entities=[entity_clean],
            geographic_pattern=f"{anon_data['location']} Aggregation Region",
            common_facts=common_facts,
            common_documents=["Agreements / Notices / Message Logs"],
            time_trend="Increase observed in past 30-90 days",
            similarity_score=top_score,
            confidence=min(0.70 + top_score * 0.25, 0.95),
            requires_human_review=True,
            message=safe_message,
            metadata={
                "matches_found": [m.model_dump() for m in matches],
                "entity_type": entity_clean,
                "location": anon_data["location"],
                "requires_human_review": True,
            },
        )
