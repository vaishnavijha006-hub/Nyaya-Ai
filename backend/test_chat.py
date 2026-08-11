import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
try:
    response = client.post("/chat/stream", json={"question": "hello", "stream": True})
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
