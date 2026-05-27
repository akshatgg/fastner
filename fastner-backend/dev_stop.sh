#!/bin/bash

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ----------------------------------------------------------------------------
# Logger: timestamped, leveled logging helpers.
# ----------------------------------------------------------------------------
_log() {
    local color="$1"; local level="$2"; shift 2
    printf "${color}[%s] %-7s${NC} %s\n" "$(date '+%H:%M:%S')" "$level" "$*"
}
log_info()    { _log "$BLUE"   "INFO"    "$@"; }
log_warn()    { _log "$YELLOW" "WARN"    "$@"; }
log_success() { _log "$GREEN"  "SUCCESS" "$@"; }

cd "$(dirname "$0")" || exit 1

log_info "Stopping development environment..."

# Stop PostgreSQL container (keeps data volume)
docker compose down

log_info "Killing processes on development ports..."

# Ports used by dev environment
PORTS=(8000 54323)

for port in "${PORTS[@]}"; do
    if lsof -i :$port -t > /dev/null 2>&1; then
        log_warn "Killing processes on port $port..."
        lsof -i :$port -t | xargs kill -9 2>/dev/null
    fi
done

log_success "Development environment stopped"
log_success "All development ports cleared"
