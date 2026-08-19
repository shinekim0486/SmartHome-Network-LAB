import json
import urllib.request

request = urllib.request.Request(
    "http://127.0.0.1:8000/api/devices/door",
    data=json.dumps({"state": "open"}).encode(),
    headers={"Content-Type": "application/json"},
    method="PUT",
)
with urllib.request.urlopen(request, timeout=3) as response:
    print(response.read().decode())
