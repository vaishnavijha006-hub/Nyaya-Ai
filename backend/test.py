import urllib.request, json
req = urllib.request.Request('http://127.0.0.1:8000/chat/stream', data=json.dumps({'question':'test'}).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    urllib.request.urlopen(req)
except Exception as e:
    print(e.read().decode())
