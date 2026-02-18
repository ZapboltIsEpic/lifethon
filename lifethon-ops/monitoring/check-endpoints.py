cat > ~/lifethon-ops/monitoring/check-endpoints.py << 'EOF'
#!/usr/bin/env python3
"""
LifeThon API Endpoint Health Checker
Demonstrates: HTTP requests, JSON parsing, error handling
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8081"
TIMEOUT = 5

# Endpoints to check
ENDPOINTS = [
    {"path": "/api/gacha/info", "method": "GET", "expected": 200},
    {"path": "/api/coins", "method": "GET", "expected": [200, 401]},  # May need auth
    {"path": "/api/inventory", "method": "GET", "expected": [200, 401]},
    {"path": "/api/auth/verify", "method": "POST", "expected": [200, 401]},
]

def check_endpoint(endpoint):
    """Test a single endpoint and return status"""
    url = BASE_URL + endpoint["path"]
    method = endpoint["method"]
    expected = endpoint["expected"] if isinstance(endpoint["expected"], list) else [endpoint["expected"]]
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=TIMEOUT)
        elif method == "POST":
            response = requests.post(url, timeout=TIMEOUT, json={})
        
        status = response.status_code
        success = status in expected
        
        return {
            "path": endpoint["path"],
            "status": status,
            "success": success,
            "response_time": response.elapsed.total_seconds()
        }
    except requests.exceptions.ConnectionError:
        return {
            "path": endpoint["path"],
            "status": "Connection Refused",
            "success": False,
            "response_time": None
        }
    except requests.exceptions.Timeout:
        return {
            "path": endpoint["path"],
            "status": "Timeout",
            "success": False,
            "response_time": None
        }
    except Exception as e:
        return {
            "path": endpoint["path"],
            "status": f"Error: {str(e)}",
            "success": False,
            "response_time": None
        }

def main():
    print("=" * 60)
    print("LifeThon API Health Check")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    
    results = []
    for endpoint in ENDPOINTS:
        result = check_endpoint(endpoint)
        results.append(result)
        
        # Print result
        status_icon = "✅" if result["success"] else "❌"
        response_time = f"{result['response_time']:.3f}s" if result['response_time'] else "N/A"
        print(f"{status_icon} {result['path']}")
        print(f"   Status: {result['status']} | Response Time: {response_time}")
    
    print()
    
    # Summary
    total = len(results)
    passed = sum(1 for r in results if r["success"])
    failed = total - passed
    
    print(f"Summary: {passed}/{total} endpoints healthy")
    
    if failed > 0:
        print(f"⚠️  {failed} endpoint(s) failing")
        sys.exit(1)
    else:
        print("✅ All endpoints healthy")
        sys.exit(0)

if __name__ == "__main__":
    main()
EOF

chmod +x ~/lifethon-ops/monitoring/check-endpoints.py