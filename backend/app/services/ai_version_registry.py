from typing import Dict, Any, Optional
from datetime import datetime

class AIVersionRegistry:
    def __init__(self):
        self.versions = {}
        self.active_version = None

    def register_version(self, version_id: str, model_name: str, parameters: Dict[str, Any], description: str):
        self.versions[version_id] = {
            "version_id": version_id,
            "model_name": model_name,
            "parameters": parameters,
            "description": description,
            "registered_at": datetime.now().isoformat()
        }

    def set_active_version(self, version_id: str) -> bool:
        if version_id in self.versions:
            self.active_version = version_id
            return True
        return False

    def get_active_version(self) -> Optional[Dict[str, Any]]:
        if self.active_version:
            return self.versions[self.active_version]
        return None

    def get_version(self, version_id: str) -> Optional[Dict[str, Any]]:
        return self.versions.get(version_id)
