class SourceTrustManager:
    def __init__(self, db_session):
        self.db = db_session

    def calculate_trust_score(self, source_version_id, publisher, reviews):
        score = 0.0
        if publisher == 'government':
            score += 90.0
        elif publisher == 'user':
            score += 10.0
            
        for review in reviews:
            score += review.get('score', 0)
            
        # Ensure user evidence doesn't cross the threshold for legal authority
        if publisher == 'user':
            score = min(score, 49.0)
            
        return min(score, 100.0)
