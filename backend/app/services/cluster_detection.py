import random
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http import models

logger = logging.getLogger(__name__)

class ClusterDetectionEngine:
    def __init__(self, qdrant_client: QdrantClient):
        self.jitter_max_seconds = 300  # Max jitter 5 minutes
        self.qdrant_client = qdrant_client
        self.collection_name = "grievances"

    def apply_time_bucketing_jitter(self, timestamp: datetime) -> datetime:
        """
        Applies time-bucketing jitter to cluster detection timestamps to preserve timing privacy.
        """
        # Snap to nearest 15-minute bucket
        bucket_minutes = 15
        minute = (timestamp.minute // bucket_minutes) * bucket_minutes
        bucketed_time = timestamp.replace(minute=minute, second=0, microsecond=0)
        
        # Add random jitter within the max seconds
        jitter = random.randint(0, self.jitter_max_seconds)
        jittered_time = bucketed_time + timedelta(seconds=jitter)
        
        logger.info(f"Applied time-bucketing jitter: original={timestamp}, bucketed={bucketed_time}, jittered={jittered_time}")
        return jittered_time

    async def detect_clusters(self, tenant_id: str, case_embedding: List[float], threshold: float = 0.85) -> List[Dict[str, Any]]:
        """
        Detects clusters of similar cases using vector search, enforcing cross-tenant privacy.
        """
        # Vector search using Qdrant
        # We must filter by tenant_id to prevent leaking User A's un-anonymized data to User B
        
        search_result = self.qdrant_client.search(
            collection_name=self.collection_name,
            query_vector=case_embedding,
            query_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="tenant_id",
                        match=models.MatchValue(value=tenant_id),
                    )
                ]
            ),
            limit=10,
            score_threshold=threshold
        )
        
        clusters = []
        for point in search_result:
            clusters.append({
                "id": point.id,
                "score": point.score,
                "payload": point.payload
            })
            
        return clusters
