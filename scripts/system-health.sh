#!/bin/bash
# System health check for LifeThon infrastructure

echo "=== System Health Check ==="
echo "Time: $(date)"
echo ""

# CPU Usage
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "  Usage: " 100 - $1 "%"}'

# Memory
echo ""
echo "Memory:"
free -h | grep Mem | awk '{print "  Used: " $3 " / " $2 " (" $3/$2*100 "%)"}'

# Disk Space
echo ""
echo "Disk Space:"
df -h / | tail -1 | awk '{print "  Used: " $3 " / " $2 " (" $5 ")"}'

# Check if LifeThon services are running
echo ""
echo "Service Status:"
systemctl is-active lifethon >/dev/null 2>&1 && echo "  ✅ Backend: Running" || echo "  ❌ Backend: Stopped"
systemctl is-active postgresql >/dev/null 2>&1 && echo "  ✅ Database: Running" || echo "  ❌ Database: Stopped"

# Check critical ports
echo ""
echo "Port Status:"
netstat -tlnp 2>/dev/null | grep -q ":8081" && echo "  ✅ Backend (8081): Listening" || echo "  ❌ Backend (8081): Not listening"
netstat -tlnp 2>/dev/null | grep -q ":5432" && echo "  ✅ PostgreSQL (5432): Listening" || echo "  ❌ PostgreSQL (5432): Not listening"

# Recent errors in logs
echo ""
echo "Recent Errors (last 10):"
journalctl -u lifethon --since "10 minutes ago" --no-pager | grep -i error | tail -5