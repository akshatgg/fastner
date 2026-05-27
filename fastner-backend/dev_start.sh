#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ----------------------------------------------------------------------------
# Logger: timestamped, leveled logging helpers used throughout the script.
# Usage: log_info "msg" | log_warn "msg" | log_error "msg" | log_success "msg"
# ----------------------------------------------------------------------------
_log() {
    local color="$1"; local level="$2"; shift 2
    printf "${color}[%s] %-7s${NC} %s\n" "$(date '+%H:%M:%S')" "$level" "$*"
}
log_info()    { _log "$BLUE"   "INFO"    "$@"; }
log_warn()    { _log "$YELLOW" "WARN"    "$@"; }
log_error()   { _log "$RED"    "ERROR"   "$@"; }
log_success() { _log "$GREEN"  "SUCCESS" "$@"; }

# Always run from the script's directory (the backend root)
cd "$(dirname "$0")" || exit 1

log_info "========================================"
log_info "   Fastner Backend Dev Environment"
log_info "========================================"

# Step 1: Install Python dependencies
log_info "[1/4] Installing Python dependencies..."

if ! command -v python3.12 &> /dev/null; then
    log_error "Python 3.12 not found. Please install it first."
    exit 1
fi

# Locate poetry in common locations
POETRY_CMD=""
if command -v poetry &> /dev/null; then
    POETRY_CMD="poetry"
elif [ -f "$HOME/.local/bin/poetry" ]; then
    POETRY_CMD="$HOME/.local/bin/poetry"
fi

if [ -z "$POETRY_CMD" ]; then
    log_warn "Poetry not found. Installing..."
    curl -sSL https://install.python-poetry.org | python3.12 -
    if [ -f "$HOME/.local/bin/poetry" ]; then
        POETRY_CMD="$HOME/.local/bin/poetry"
    else
        log_error "Poetry installation failed."
        exit 1
    fi
fi

log_info "Configuring poetry to use Python 3.12..."
$POETRY_CMD env use python3.12 > /dev/null

log_info "Installing project dependencies..."
# --no-root: this is an app, not a packaged library; sync removes stale packages
$POETRY_CMD sync --no-root
if [ $? -ne 0 ]; then
    log_error "Poetry install failed. Please check your pyproject.toml"
    exit 1
fi
log_success "Dependencies installed"

# Step 2: Start PostgreSQL container
log_info "[2/4] Starting PostgreSQL container..."
docker compose up -d

log_info "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker compose exec -T postgres-db pg_isready -U postgres -d fastner_db &> /dev/null; then
        log_success "PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "PostgreSQL did not become ready in time"
        exit 1
    fi
    sleep 2
done

# Step 3: Run database migrations
log_info "[3/4] Running database migrations..."

# Load environment variables from .env if present
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Delegate to migration.sh (shows current + target head, runs upgrade with timing)
$POETRY_CMD run sh migration.sh
if [ $? -eq 0 ]; then
    log_success "Database migrations applied successfully"
else
    log_error "Migration failed! Please check alembic errors above."
    exit 1
fi

# Step 4: Start uvicorn server
log_info "[4/4] Starting uvicorn server..."

# Free port 8000 if in use
if command -v lsof &> /dev/null; then
    PID=$(lsof -ti:8000 2>/dev/null)
    if [ -n "$PID" ]; then
        log_warn "Port 8000 is in use. Killing process $PID..."
        kill -9 $PID 2>/dev/null || true
        sleep 1
        log_success "Port 8000 freed"
    fi
fi

log_info "========================================"
log_success "Server starting on http://localhost:8000"
log_info "========================================"
log_info "Services available:"
log_info "  • API: http://localhost:8000"
log_info "  • PostgreSQL DB: postgresql://postgres:postgres@localhost:54323/fastner_db"
log_info "Press Ctrl+C to stop the server"

$POETRY_CMD run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
