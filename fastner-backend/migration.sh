#!/bin/sh
set -e

echo "=== Database Migration ==="
echo "Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Alembic: $(alembic --version 2>&1 | head -1)"
echo ""

# Save current revision before migrating (used for rollback if deployment fails)
CURRENT_REV=$(alembic current 2>&1 | grep -oE '[a-f0-9]{12,}' | head -1 || true)
if [ -z "$CURRENT_REV" ]; then
    CURRENT_REV="base"
fi
echo "Current revision: $CURRENT_REV"
echo "PRE_MIGRATION_REV=$CURRENT_REV"

# Show the target head revision(s) the database will be upgraded to
TARGET_HEAD=$(alembic heads 2>&1 | grep -oE '[a-f0-9]{12,}' | head -1 || true)
if [ -z "$TARGET_HEAD" ]; then
    TARGET_HEAD="base (no migrations defined yet)"
fi
echo "Target head:      $TARGET_HEAD"

echo ""
echo "Running: alembic upgrade head"
start_time=$(date +%s)

if alembic upgrade head 2>&1; then
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    echo "✅ Migrations completed successfully in ${duration}s"
else
    exit_code=$?
    echo "❌ Migration failed with exit code: $exit_code"
    echo "   Database may be unreachable or migration has errors."
    echo ""
    echo "Attempting to show alembic history for debugging..."
    alembic history --verbose 2>&1 | tail -20 || true
    exit 1
fi
