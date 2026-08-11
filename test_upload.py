import requests

# create a dummy text file
with open("test.txt", "w") as f:
    f.write("Hello world!")

files = {'file': open('test.txt', 'rb')}
try:
    response = requests.post('http://127.0.0.1:8000/pdf/upload', files=files)
    print("Status Code:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
