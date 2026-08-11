import requests
from reportlab.pdfgen import canvas
import io

def create_dummy_pdf():
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer)
    p.drawString(100, 100, "Hello world!")
    p.showPage()
    p.save()
    return buffer.getvalue()

pdf_bytes = create_dummy_pdf()
files = {'file': ('test.pdf', pdf_bytes, 'application/pdf')}
try:
    response = requests.post('http://127.0.0.1:8000/pdf/upload', files=files)
    print("Status Code:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
