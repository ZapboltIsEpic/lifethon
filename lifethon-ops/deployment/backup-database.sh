#!/bin/bash
# LifeThon Database Backup Script
# Demonstrates: PostgreSQL operations, file management, error handling

BACKUP_DIR="$HOME/lifethon-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/lifethon_backup_$DATE.sql"
DB_NAME="LifeThon"
DB_USER="postgres"
DB_HOST="localhost"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "=== LifeThon Database Backup ==="
echo "Time: $(date)"
echo "Target: $BACKUP_FILE"
echo ""

# Check if PostgreSQL is accessible
if ! timeout 2 bash -c "cat < /dev/null > /dev/tcp/$DB_HOST/5432" 2>/dev/null; then
    echo "❌ Cannot connect to PostgreSQL on port 5432"
    exit 1
fi

# Perform backup
echo "Creating backup..."
if PGPASSWORD=admin pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > "$BACKUP_FILE" 2>/dev/null; then
    # Get file size
    size=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup completed successfully"
    echo "   File: $BACKUP_FILE"
    echo "   Size: $size"
    
    # Keep only last 7 backups
    echo ""
    echo "Cleaning old backups (keeping last 7)..."
    ls -t "$BACKUP_DIR"/lifethon_backup_*.sql | tail -n +8 | xargs -r rm
    
    remaining=$(ls "$BACKUP_DIR"/lifethon_backup_*.sql 2>/dev/null | wc -l)
    echo "   Backups remaining: $remaining"
else
    echo "❌ Backup failed"
    rm -f "$BACKUP_FILE"
    exit 1
fi

echo ""
echo "=== Backup Complete ==="
