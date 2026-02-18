cat > ~/system-health.sh << 'EOF'
#!/bin/bash
# Health check script for WSL1 environment
# Works by testing actual connectivity instead of checking network sockets

# Configuration
BACKEND_PORT=8081
FRONTEND_PORT=3000
DB_PORT=8080

echo "=== LifeThon Health Check ==="
echo "Time: $(date)"
echo ""

# Function to check if service responds
check_service() {
    local name=$1
    local url=$2
    local expected_codes=$3  # e.g., "200|404|401"
    
    # Try to connect with timeout
    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$url" 2>/dev/null)
    
    if echo "$response" | grep -qE "$expected_codes"; then
        echo "✅ $name - HEALTHY (HTTP $response)"
        return 0
    else
        echo "❌ $name - DOWN (HTTP $response or timeout)"
        return 1
    fi
}

# Function to check TCP port
check_port() {
    local name=$1
    local host=$2
    local port=$3
    
    # Use nc (netcat) or timeout with bash
    if command -v nc &> /dev/null; then
        if nc -z -w2 "$host" "$port" 2>/dev/null; then
            echo "✅ $name - Port $port OPEN"
            return 0
        else
            echo "❌ $name - Port $port CLOSED"
            return 1
        fi
    else
        # Fallback: use bash TCP test
        if timeout 2 bash -c "cat < /dev/null > /dev/tcp/$host/$port" 2>/dev/null; then
            echo "✅ $name - Port $port OPEN"
            return 0
        else
            echo "❌ $name - Port $port CLOSED"
            return 1
        fi
    fi
}

# Check Backend
echo "1. Backend Service:"
check_service "Backend API" "http://localhost:$BACKEND_PORT/api/gacha/info" "200"
echo ""

# Check Frontend
echo "2. Frontend Service:"
check_service "Frontend" "http://localhost:$FRONTEND_PORT" "200|304"
echo ""

# Check Database
echo "3. Database:"
check_port "PostgreSQL" "localhost" "$DB_PORT"
echo ""

# Check Processes
echo "4. Process Status:"
if ps aux | grep -v grep | grep -q "java"; then
    echo "✅ Java Backend Process - RUNNING"
else
    echo "❌ Java Backend Process - NOT RUNNING"
fi

if ps aux | grep -v grep | grep -q "node.*next"; then
    echo "✅ Node Frontend Process - RUNNING"
else
    echo "❌ Node Frontend Process - NOT RUNNING"
fi
echo ""

# System Resources
echo "5. System Resources:"
cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
mem_usage=$(free | grep Mem | awk '{printf("%.1f"), $3/$2 * 100.0}')
disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')

echo "  CPU: ${cpu_usage}%"
echo "  Memory: ${mem_usage}%"
echo "  Disk: ${disk_usage}%"

# Warnings
if (( $(echo "$cpu_usage > 80" | bc -l) )); then
    echo "  ⚠️  High CPU usage!"
fi
if (( $(echo "$mem_usage > 80" | bc -l) )); then
    echo "  ⚠️  High memory usage!"
fi
if [ "$disk_usage" -gt 80 ]; then
    echo "  ⚠️  Low disk space!"
fi

echo ""
echo "=== Health Check Complete ==="
EOF

chmod +x ~/system-health.sh