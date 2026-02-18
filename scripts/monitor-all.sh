cat > ~/lifethon-ops/monitoring/monitor-all.sh << 'EOF'
#!/bin/bash
# LifeThon - Complete system monitoring
# Demonstrates: ps, resource monitoring, process management

echo "╔════════════════════════════════════════════════╗"
echo "║       LifeThon Production Health Monitor       ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check Java backend process (demonstrates ps aux | grep)
echo "📊 BACKEND PROCESS:"
if ps aux | grep -v grep | grep "spring-boot:run\|lifethon.*jar" > /dev/null; then
    echo "✅ Java Backend Running"
    # Get PID and resource usage
    backend_pid=$(ps aux | grep -v grep | grep "spring-boot:run\|lifethon.*jar" | awk '{print $2}' | head -1)
    cpu=$(ps aux | grep "$backend_pid" | awk '{print $3}')
    mem=$(ps aux | grep "$backend_pid" | awk '{print $4}')
    echo "   PID: $backend_pid | CPU: ${cpu}% | MEM: ${mem}%"
else
    echo "❌ Java Backend NOT Running"
    echo "   → Start with: cd backend && ./mvnw spring-boot:run"
fi

echo ""

# Check Node frontend process
echo "🎨 FRONTEND PROCESS:"
if ps aux | grep -v grep | grep "node.*next" > /dev/null; then
    echo "✅ Node Frontend Running"
    frontend_pid=$(ps aux | grep -v grep | grep "node.*next" | awk '{print $2}' | head -1)
    echo "   PID: $frontend_pid"
else
    echo "❌ Node Frontend NOT Running"
    echo "   → Start with: cd frontend && npm run dev"
fi

echo ""

# Test backend connectivity (demonstrates curl, HTTP status)
echo "🌐 BACKEND API CONNECTIVITY:"
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/gacha/info --connect-timeout 3 2>/dev/null)
if [ "$response" = "200" ]; then
    echo "✅ Backend API responding (HTTP $response)"
    # Test database connection through API
    db_check=$(curl -s http://localhost:8081/api/gacha/info 2>/dev/null | grep -o "itemCount" | wc -l)
    if [ "$db_check" -gt 0 ]; then
        echo "✅ Database connection working"
    fi
else
    echo "❌ Backend API not responding (HTTP $response)"
    echo "   → Check logs: tail -f backend/logs/spring-boot-logger.log"
fi

echo ""

# Check PostgreSQL port (demonstrates network port checking)
echo "🗄️  DATABASE CONNECTIVITY:"
# Method 1: Using /dev/tcp (bash built-in)
if timeout 2 bash -c "cat < /dev/null > /dev/tcp/localhost/5432" 2>/dev/null; then
    echo "✅ PostgreSQL port 5432 accessible"
    # Try to get actual connections (if psql installed)
    if command -v psql &> /dev/null; then
        conn_count=$(PGPASSWORD=admin psql -h localhost -U postgres -d LifeThon -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ')
        echo "   Active connections: ${conn_count:-unknown}"
    fi
else
    echo "❌ PostgreSQL port 5432 not accessible"
    echo "   → Check: sudo service postgresql status"
fi

echo ""

# System resources (demonstrates top, free, df)
echo "💻 SYSTEM RESOURCES:"
# CPU usage
cpu_idle=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/")
cpu_used=$(echo "100 - $cpu_idle" | bc)
echo "   CPU Usage: ${cpu_used}%"

# Memory usage
mem_total=$(free -m | grep Mem | awk '{print $2}')
mem_used=$(free -m | grep Mem | awk '{print $3}')
mem_percent=$(echo "scale=1; $mem_used * 100 / $mem_total" | bc)
echo "   Memory: ${mem_used}MB / ${mem_total}MB (${mem_percent}%)"

# Disk usage
disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
disk_avail=$(df -h / | tail -1 | awk '{print $4}')
echo "   Disk: ${disk_usage}% used (${disk_avail} available)"

# Warnings
if (( $(echo "$cpu_used > 80" | bc -l) )); then
    echo "   ⚠️  HIGH CPU USAGE!"
fi
if (( $(echo "$mem_percent > 80" | bc -l) )); then
    echo "   ⚠️  HIGH MEMORY USAGE!"
fi
if [ "$disk_usage" -gt 80 ]; then
    echo "   ⚠️  LOW DISK SPACE!"
fi

echo ""
echo "Last checked: $(date '+%Y-%m-%d %H:%M:%S')"
EOF

chmod +x ~/lifethon-ops/monitoring/monitor-all.sh