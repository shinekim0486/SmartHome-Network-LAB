import json
import random
import urllib.request

sample = {"temperature": round(random.uniform(20, 27), 1), "humidity": random.randint(35, 60)}
print("local sensor sample:", json.dumps(sample, ensure_ascii=False))
print("Tip: capture tcp.port == 8000 while requesting the API health endpoint.")
with urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=3) as response:
    print("API:", response.read().decode("utf-8"))
