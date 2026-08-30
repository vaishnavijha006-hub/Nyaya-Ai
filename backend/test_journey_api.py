import requests
import json
import sseclient

url = "http://127.0.0.1:8000/chat/stream"
headers = {'Content-Type': 'application/json'}
session_id = "test_journey_user_1"

print("--- STEP 1: Initial Query ---")
payload = {
    "question": "My landlord has illegally locked me out of my rented house.",
    "session_id": session_id,
    "stream": True
}
response = requests.post(url, json=payload, stream=True)
client = sseclient.SSEClient(response)
for event in client.events():
    if event.data:
        data = json.loads(event.data)
        print(f"[{data.get('type')}] {data.get('journey_stage', '')}: {data.get('content') or data.get('message') or data}")

print("\n--- STEP 2: Answering Follow up ---")
payload = {
    "question": "It happened yesterday. Yes, I have a rent agreement.",
    "session_id": session_id,
    "stream": True
}
response = requests.post(url, json=payload, stream=True)
client = sseclient.SSEClient(response)
for event in client.events():
    if event.data:
        data = json.loads(event.data)
        print(f"[{data.get('type')}] {data.get('journey_stage', '')}: {data.get('content') or data.get('message') or data}")

