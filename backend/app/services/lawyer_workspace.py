from typing import List, Optional
from uuid import UUID

class LawyerWorkspaceService:
    def __init__(self, db_client):
        self.db = db_client
        
    async def verify_lawyer(self, lawyer_id: UUID) -> bool:
        response = self.db.table('lawyer_profiles').select('is_verified').eq('id', str(lawyer_id)).execute()
        if not response.data:
            return False
        return response.data[0].get('is_verified', False)

    async def accept_case(self, lawyer_id: UUID, case_id: UUID) -> bool:
        if not await self.verify_lawyer(lawyer_id):
            raise Exception("Unverified lawyers cannot accept cases")
            
        response = self.db.table('lawyer_case_assignments').insert({
            'case_id': str(case_id),
            'lawyer_id': str(lawyer_id),
            'status': 'accepted'
        }).execute()
        return bool(response.data)

    async def get_private_notes(self, lawyer_id: UUID, case_id: UUID) -> List[dict]:
        response = self.db.table('lawyer_case_notes').select('*').eq('lawyer_id', str(lawyer_id)).eq('case_id', str(case_id)).execute()
        return response.data

    async def add_private_note(self, lawyer_id: UUID, case_id: UUID, note: str) -> dict:
        response = self.db.table('lawyer_case_notes').insert({
            'case_id': str(case_id),
            'lawyer_id': str(lawyer_id),
            'note': note
        }).execute()
        return response.data[0] if response.data else None
