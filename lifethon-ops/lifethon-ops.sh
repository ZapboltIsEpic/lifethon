cat > ~/lifethon-ops/lifethon-ops.sh << 'EOF'
#!/bin/bash
# LifeThon Operations Master Control
# Quick access to all operational tools

show_menu() {
    clear
    echo "╔════════════════════════════════════════════════╗"
    echo "║        LifeThon Operations Control Panel       ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    echo "Monitoring:"
    echo "  1) Full system health check"
    echo "  2) Check API endpoints"
    echo ""
    echo "Troubleshooting:"
    echo "  3) Diagnose backend issues"
    echo "  4) Network debugging"
    echo ""
    echo "Maintenance:"
    echo "  5) Backup database"
    echo "  6) View recent logs"
    echo ""
    echo "  0) Exit"
    echo ""
    echo -n "Select option: "
}

while true; do
    show_menu
    read -r choice
    
    case $choice in
        1)
            echo ""
            ~/lifethon-ops/monitoring/monitor-all.sh
            ;;
        2)
            echo ""
            python3 ~/lifethon-ops/monitoring/check-endpoints.py
            ;;
        3)
            echo ""
            ~/lifethon-ops/troubleshooting/diagnose-backend.sh
            ;;
        4)
            echo ""
            python3 ~/lifethon-ops/troubleshooting/network-debug.py
            ;;
        5)
            echo ""
            ~/lifethon-ops/backup/backup-database.sh
            ;;
        6)
            echo ""
            echo "Recent backend logs:"
            tail -50 ~/LifeThon/backend/logs/spring-boot-logger.log 2>/dev/null || echo "Log file not found"
            ;;
        0)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid option"
            ;;
    esac
    
    echo ""
    echo "Press Enter to continue..."
    read -r
done
EOF

chmod +x ~/lifethon-ops/lifethon-ops.sh