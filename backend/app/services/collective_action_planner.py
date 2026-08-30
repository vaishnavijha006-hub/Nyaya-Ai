import logging
import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models

logger = logging.getLogger(__name__)

class CollectiveActionPlanner:
    def __init__(self, db_client, qdrant_client: QdrantClient):
        self.db_client = db_client
        self.qdrant_client = qdrant_client
        self.collection_name = "collective_actions"
        self._ensure_collection()
        self._mock_db = {} # In-memory fallback if db_client is None

    def _ensure_collection(self):
        try:
            collections = self.qdrant_client.get_collections().collections
            if not any(c.name == self.collection_name for c in collections):
                self.qdrant_client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
                )
        except Exception as e:
            logger.error(f"Error ensuring qdrant collection: {e}")

    async def plan_collective_action(self, tenant_id: str, cluster_id: str, case_ids: List[str], cluster_embedding: Optional[List[float]] = None, complaint_text: Optional[str] = None) -> Dict[str, Any]:
        """
        Creates a new collective action plan based on a cluster of cases.
        Uses Qdrant vector search to find similar past collective actions for this tenant.
        """
        similar_actions = []
        if cluster_embedding:
            try:
                # Find similar past actions for this tenant using Qdrant
                search_result = self.qdrant_client.query_points(
                    collection_name=self.collection_name,
                    query=cluster_embedding,
                    query_filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="tenant_id",
                                match=models.MatchValue(value=tenant_id),
                            )
                        ]
                    ),
                    limit=3,
                    score_threshold=0.8
                )
                similar_actions = [point.payload.get("strategy", "") for point in search_result.points]
            except Exception as e:
                logger.warning(f"Qdrant search failed: {e}")

        # Basic clustering strategy generation
        strategy = f"Initiate collective action. Combine evidence from {len(case_ids)} affected users."
        if similar_actions:
            strategy += f"\nAligned with past successful strategy: {similar_actions[0]}"

        plan_id = str(uuid.uuid4())
        plan_data = {
            "id": plan_id,
            "cluster_id": cluster_id,
            "tenant_id": tenant_id,
            "title": f"Collective Action for Cluster {cluster_id}",
            "strategy": strategy,
            "status": "proposed",
            "case_count": len(case_ids)
        }
        
        # Save to Qdrant so future queries can find this strategy
        if cluster_embedding:
            try:
                self.qdrant_client.upsert(
                    collection_name=self.collection_name,
                    points=[
                        models.PointStruct(
                            id=plan_id,
                            vector=cluster_embedding,
                            payload={"tenant_id": tenant_id, "strategy": strategy, "complaint_text": complaint_text or ""}
                        )
                    ]
                )
            except Exception as e:
                logger.error(f"Failed to upsert to Qdrant: {e}")

        # Insert into collective_action_plans DB
        if self.db_client:
            try:
                result = self.db_client.table("collective_action_plans").insert(plan_data).execute()
                return result.data[0] if result.data else plan_data
            except Exception as e:
                logger.error(f"DB insert failed: {e}")
        
        # Fallback to mock DB
        self._mock_db[plan_id] = plan_data
        return plan_data

    async def get_plan(self, plan_id: str, tenant_id: str) -> Dict[str, Any]:
        if self.db_client:
            try:
                result = self.db_client.table("collective_action_plans").select("*").eq("id", plan_id).eq("tenant_id", tenant_id).execute()
                if result.data:
                    return result.data[0]
            except Exception as e:
                logger.error(f"DB select failed: {e}")
                
        # Fallback to mock DB
        plan = self._mock_db.get(plan_id)
        if plan and plan.get("tenant_id") == tenant_id:
            return plan
        return {}
