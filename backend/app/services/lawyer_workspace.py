from typing import List, Optional
from uuid import UUID

_mock_notes = []
_mock_assignments = []

class LawyerWorkspaceService:
    def __init__(self, db_client):
        self.db = db_client
        
    async def verify_lawyer(self, lawyer_id: UUID) -> bool:
        if self.db is None:
            return True # Hackathon mock
        response = self.db.table('lawyer_profiles').select('is_verified').eq('id', str(lawyer_id)).execute()
        if not response.data:
            return False
        return response.data[0].get('is_verified', False)

    async def accept_case(self, lawyer_id: UUID, case_id: UUID) -> bool:
        if not await self.verify_lawyer(lawyer_id):
            raise Exception("Unverified lawyers cannot accept cases")
            
        if self.db is None:
            _mock_assignments.append({'case_id': str(case_id), 'lawyer_id': str(lawyer_id), 'status': 'accepted'})
            return True
            
        response = self.db.table('lawyer_case_assignments').insert({
            'case_id': str(case_id),
            'lawyer_id': str(lawyer_id),
            'status': 'accepted'
        }).execute()
        return bool(response.data)

    async def get_private_notes(self, lawyer_id: UUID, case_id: UUID) -> List[dict]:
        if self.db is None:
            return [n for n in _mock_notes if n['lawyer_id'] == str(lawyer_id) and n['case_id'] == str(case_id)]
            
        response = self.db.table('lawyer_case_notes').select('*').eq('lawyer_id', str(lawyer_id)).eq('case_id', str(case_id)).execute()
        return response.data

    async def add_private_note(self, lawyer_id: UUID, case_id: UUID, note: str) -> dict:
        if self.db is None:
            n = {'case_id': str(case_id), 'lawyer_id': str(lawyer_id), 'note': note, 'id': len(_mock_notes)+1}
            _mock_notes.append(n)
            return n
            
        response = self.db.table('lawyer_case_notes').insert({
            'case_id': str(case_id),
            'lawyer_id': str(lawyer_id),
            'note': note
        }).execute()
        return response.data[0] if response.data else None

