from uuid import UUID

class LawyerReviewService:
    def __init__(self, db_client):
        self.db = db_client

    async def submit_review(self, lawyer_id: UUID, case_id: UUID, review_content: str) -> dict:
        response = self.db.table('lawyer_reviews').insert({
            'lawyer_id': str(lawyer_id),
            'case_id': str(case_id),
            'review_content': review_content
        }).execute()
        return response.data[0] if response.data else None
        
    async def get_reviews(self, case_id: UUID) -> list:
        response = self.db.table('lawyer_reviews').select('*').eq('case_id', str(case_id)).execute()
        return response.data
