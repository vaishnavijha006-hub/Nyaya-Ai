from typing import List, Dict, Any, Optional
from datetime import datetime

class HumanReviewSystem:
    def __init__(self):
        self.pending_reviews = {}
        self.completed_reviews = {}

    def submit_for_review(self, review_id: str, content_type: str, content: Any, risk_level: str = "medium"):
        """
        Submits content for human review.
        """
        self.pending_reviews[review_id] = {
            "review_id": review_id,
            "content_type": content_type,
            "content": content,
            "risk_level": risk_level,
            "status": "pending",
            "submitted_at": datetime.now().isoformat()
        }
        return review_id

    def get_pending_reviews(self) -> List[Dict[str, Any]]:
        return list(self.pending_reviews.values())

    def complete_review(self, review_id: str, reviewer_id: str, decision: str, comments: str) -> bool:
        """
        Completes a pending review with a decision (e.g., 'approved', 'rejected').
        """
        if review_id in self.pending_reviews:
            review_data = self.pending_reviews.pop(review_id)
            review_data["status"] = "completed"
            review_data["decision"] = decision
            review_data["reviewer_id"] = reviewer_id
            review_data["comments"] = comments
            review_data["completed_at"] = datetime.now().isoformat()
            
            self.completed_reviews[review_id] = review_data
            return True
        return False
        
    def get_review_history(self, review_id: str) -> Optional[Dict[str, Any]]:
        return self.completed_reviews.get(review_id)
