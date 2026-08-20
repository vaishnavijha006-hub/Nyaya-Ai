import logging
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http import models

logger = logging.getLogger(__name__)

class CollectiveActionPlanner:
    def __init__(self, db_client, qdrant_client: QdrantClient):
        self.db_client = db_client
        self.qdrant_client = qdrant_client
        self.collection_name = "collective_actions"

    async def plan_collective_action(self, tenant_id: str, cluster_id: str, case_ids: List[str], cluster_embedding: List[float] = None) -> Dict[str, Any]:
        """
        Creates a new collective action plan based on a cluster of cases.
        Uses Qdrant vector search to find similar past collective actions for this tenant.
        """
        similar_actions = []
        if cluster_embedding:
            # Find similar past actions for this tenant using Qdrant to inform the plan
            search_result = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=cluster_embedding,
                query_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="tenant_id",
                            match=models.MatchValue(value=tenant_id),
                        )
                    ]
                ),
                limit=3
            )
            similar_actions = [point.payload.get("strategy", "") for point in search_result]

        strategy = f"Generated strategy informed by {len(similar_actions)} past actions."
        if similar_actions:
            strategy += f" Example: {similar_actions[0]}"

        # Insert into collective_action_plans
        plan_data = {
            "cluster_id": cluster_id,
            "tenant_id": tenant_id,
            "title": f"Collective Action for Cluster {cluster_id}",
            "strategy": strategy,
            "status": "proposed"
        }
        
        result = self.db_client.table("collective_action_plans").insert(plan_data).execute()
        return result.data[0] if result.data else {}

    async def get_plan(self, plan_id: str, tenant_id: str) -> Dict[str, Any]:
        result = self.db_client.table("collective_action_plans").select("*").eq("id", plan_id).eq("tenant_id", tenant_id).execute()
        return result.data[0] if result.data else {}
