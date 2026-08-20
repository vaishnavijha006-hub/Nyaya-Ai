from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseProvider(ABC):
    @abstractmethod
    async def send(self, recipient: str, message: str, **kwargs) -> Dict[str, Any]:
        """Send a message via the provider."""
        pass

    @abstractmethod
    async def status(self, message_id: str) -> Dict[str, Any]:
        """Check the status of a message."""
        pass
