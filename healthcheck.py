"""Health check for NeuroCreative backend."""
import sys
try:
    import requests
    r = requests.get("http://localhost:8000/openapi.json", timeout=3)
    sys.exit(0 if r.status_code == 200 else 1)
except Exception:
    sys.exit(1)
