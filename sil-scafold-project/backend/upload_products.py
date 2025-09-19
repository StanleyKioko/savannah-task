import requests

url = 'http://localhost:8000/api/products/upload/'
files = {'file': open('sample_products.csv', 'rb')}
response = requests.post(url, files=files)
print(response.status_code)
print(response.json())