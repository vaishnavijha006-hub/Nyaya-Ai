import requests

try:
    resp = requests.post("http://127.0.0.1:8000/chat/stream", json={"question": "hello"})
    print("Status:", resp.status_code)
    print("Response:", resp.text)
except Exception as e:
    print(e)
