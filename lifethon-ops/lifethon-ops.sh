#!/bin/bash
# LifeThon Operations Master Control

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
            "$SCRIPT_DIR/monitoring/monitor-all.sh"
            ;;
        2)
            echo ""
            python3 "$SCRIPT_DIR/monitoring/check-endpoints.py"
            ;;
        3)
            echo ""
            "$SCRIPT_DIR/troubleshooting/diagnose-backend.sh"
            ;;
        4)
            echo ""
            python3 "$SCRIPT_DIR/troubleshooting/network-debug.py"
            ;;
        5)
            echo ""
            "$SCRIPT_DIR/deployment/backup-database.sh"
            ;;
        6)
            echo ""
            echo "Recent backend logs:"
            tail -50 ../backend/logs/spring-boot-logger.log 2>/dev/null || echo "Log file not found"
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
