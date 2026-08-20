from unittest.mock import AsyncMock

class MockProviders:
    def __init__(self):
        self.redis = AsyncMock()
        self.postgres = AsyncMock()
        self.rag = AsyncMock()
        self.sms = AsyncMock()
