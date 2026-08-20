import asyncio
import httpx
import time
import sys

async def fetch(client, url, method="GET", json=None):
    try:
        if method == "GET":
            response = await client.get(url, timeout=5.0)
        else:
            response = await client.post(url, json=json, timeout=5.0)
        return response.status_code
    except Exception as e:
        return str(e)

async def main():
    async with httpx.AsyncClient() as client:
        print("Starting load test...")
        
        # 50 normal API requests
        print("Running 50 normal requests...")
        normal_tasks = [fetch(client, "http://localhost:8000/health") for _ in range(50)]
        
        # 100 concurrent webhook requests
        print("Running 100 webhook requests...")
        payload = {"session_id": "test_webhook", "event": "payment_completed"}
        webhook_tasks = [fetch(client, "http://localhost:8000/api/v1/webhook", method="POST", json=payload) for _ in range(100)]
        
        # 20 concurrent emergency requests
        print("Running 20 emergency requests...")
        emergency_payload = {"message": "help me", "location": "test"}
        emergency_tasks = [fetch(client, "http://localhost:8000/api/v1/emergency", method="POST", json=emergency_payload) for _ in range(20)]
        
        start = time.time()
        results = await asyncio.gather(*(normal_tasks + webhook_tasks + emergency_tasks))
        end = time.time()
        
        print(f"Total time: {end - start:.2f} seconds")
        print("Normal results:", [r for r in results[:50]])
        print("Webhook results:", [r for r in results[50:150]])
        print("Emergency results:", [r for r in results[150:]])

if __name__ == "__main__":
    asyncio.run(main())
