from typing import Dict, Any

class CollectiveDocumentEngine:
    def __init__(self, db_client):
        self.db_client = db_client

    async def generate_document(self, plan_id: str, doc_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates common legal documents like petitions or notices for the collective action.
        """
        # Mock document generation
        doc_data = {
            "plan_id": plan_id,
            "title": f"Collective {doc_type}",
            "document_type": doc_type,
            "file_path": f"/docs/{plan_id}_{doc_type}.pdf"
        }
        
        result = self.db_client.table("collective_documents").insert(doc_data).execute()
        return result.data[0] if result.data else {}
