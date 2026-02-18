cat > ~/lifethon-ops/troubleshooting/diagnose-backend.sh << 'EOF'
#!/bin/bash
# LifeThon Backend Diagnostics
# Demonstrates: DNS, TCP/IP, process debugging, log analysis

PORT=8081
HOST="localhost"

echo "╔════════════════════════════════════════════════╗"
echo "║     LifeThon Backend Diagnostic Tool          ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Step 1: DNS Resolution (if using hostname instead of localhost)
echo "🔍 STEP 1: DNS Resolution"
if [ "$HOST" != "localhost" ] && [ "$HOST" != "127.0.0.1" ]; then
    echo "Resolving hostname: $HOST"
    if command -v nslookup &> /dev/null; then
        nslookup $HOST
    else
        echo "nslookup not available, using ping"
        ping -c 1 $HOST 2>&1 | grep "PING"
    fi
else
    echo "Using localhost (127.0.0.1) - no DNS lookup needed"
fi
echo ""

# Step 2: Check if process is running
echo "🔍 STEP 2: Process Check"
if ps aux | grep -v grep | grep "spring-boot:run\|lifethon.*jar" > /dev/null; then
    echo "✅ Backend process is running"
    backend_pid=$(ps aux | grep -v grep | grep "spring-boot:run\|lifethon.*jar" | awk '{print $2}' | head -1)
    echo "   PID: $backend_pid"
    echo "   Command: $(ps -p $backend_pid -o cmd --no-headers | cut -c 1-80)"
    
    # Check process uptime
    uptime=$(ps -p $backend_pid -o etime --no-headers | tr -d ' ')
    echo "   Uptime: $uptime"
    
    # Check resource usage
    echo "   Resources:"
    ps -p $backend_pid -o %cpu,%mem,vsz,rss --no-headers | awk '{printf "      CPU: %s%% | MEM: %s%% | VSZ: %s KB | RSS: %s KB\n", $1, $2, $3, $4}'
else
    echo "❌ Backend process is NOT running"
    echo ""
    echo "Possible reasons:"
    echo "  1. Service crashed (check logs)"
    echo "  2. Never started (run ./mvnw spring-boot:run)"
    echo "  3. Wrong directory (check you're in backend/)"
    exit 1
fi
echo ""

# Step 3: TCP Port Check (demonstrates TCP concepts)
echo "🔍 STEP 3: TCP Port Connectivity"
echo "Checking if port $PORT is listening..."

# Try multiple methods (educational - shows different approaches)

# Method 1: /dev/tcp (bash built-in)
if timeout 2 bash -c "cat < /dev/null > /dev/tcp/$HOST/$PORT" 2>/dev/null; then
    echo "✅ Port $PORT is accessible (bash /dev/tcp test)"
else
    echo "❌ Port $PORT is NOT accessible"
    echo ""
    echo "Troubleshooting steps:"
    echo "  1. Check if backend is binding to correct port"
    echo "     grep 'server.port' backend/src/main/resources/application.properties"
    echo "  2. Check if another process is using port $PORT"
    echo "     From Windows: netstat -ano | findstr $PORT"
    echo "  3. Check firewall rules"
    exit 1
fi
echo ""

# Step 4: HTTP Request Test
echo "🔍 STEP 4: HTTP Request Test"
echo "Testing HTTP endpoint: http://$HOST:$PORT/api/gacha/info"

http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$HOST:$PORT/api/gacha/info" --connect-timeout 5 2>/dev/null)

if [ "$http_code" = "200" ]; then
    echo "✅ HTTP request successful (200 OK)"
    
    # Get response time
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "http://$HOST:$PORT/api/gacha/info" --connect-timeout 5 2>/dev/null)
    echo "   Response time: ${response_time}s"
    
    # Check if JSON response is valid
    response=$(curl -s "http://$HOST:$PORT/api/gacha/info" 2>/dev/null)
    if echo "$response" | grep -q "itemCount"; then
        echo "✅ API returning valid JSON data"
    fi
elif [ "$http_code" = "404" ]; then
    echo "⚠️  HTTP 404 - Endpoint not found"
    echo "   Backend is running but endpoint may be wrong"
elif [ "$http_code" = "500" ]; then
    echo "❌ HTTP 500 - Server error"
    echo "   Check backend logs for exceptions"
elif [ "$http_code" = "000" ]; then
    echo "❌ Connection failed"
    echo "   Backend may be down or not accepting connections"
else
    echo "⚠️  HTTP $http_code"
fi
echo ""

# Step 5: Database Connection Check
echo "🔍 STEP 5: Database Connection"
if timeout 2 bash -c "cat < /dev/null > /dev/tcp/localhost/5432" 2>/dev/null; then
    echo "✅ PostgreSQL port 5432 is accessible"
else
    echo "❌ PostgreSQL port 5432 is NOT accessible"
    echo "   Backend may fail when accessing database"
    echo "   Check: sudo service postgresql status"
fi
echo ""

# Step 6: Recent Errors in Logs
echo "🔍 STEP 6: Recent Errors"
log_file="backend/logs/spring-boot-logger.log"
if [ -f "$log_file" ]; then
    error_count=$(tail -100 "$log_file" | grep -c "ERROR")
    if [ "$error_count" -gt 0 ]; then
        echo "⚠️  Found $error_count errors in last 100 log lines"
        echo "Recent errors:"
        tail -100 "$log_file" | grep "ERROR" | tail -3
    else
        echo "✅ No recent errors in logs"
    fi
else
    echo "⚠️  Log file not found at $log_file"
fi
echo ""

echo "═══════════════════════════════════════════════"
echo "Diagnosis complete!"
echo "═══════════════════════════════════════════════"
EOF

chmod +x ~/lifethon-ops/troubleshooting/diagnose-backend.sh