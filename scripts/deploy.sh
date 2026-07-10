#!/bin/bash
set -euo pipefail

# ============================================
# AI Agent Production System - Deploy Script
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    command -v docker &>/dev/null || { log_error "Docker is required"; exit 1; }
    command -v docker-compose &>/dev/null || { log_error "Docker Compose is required"; exit 1; }
    
    log_success "All prerequisites found"
}

# Setup environment
setup_env() {
    log_info "Setting up environment..."
    
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
        log_warn "Created .env from .env.example. Please configure your API keys."
    else
        log_success ".env file exists"
    fi
}

# Build and start services
start_services() {
    local profile="${1:-development}"
    
    log_info "Starting services in $profile mode..."
    
    cd "$PROJECT_DIR"
    
    if [ "$profile" = "production" ]; then
        docker-compose -f docker/docker-compose.yml --profile production up -d --build
    else
        docker-compose -f docker/docker-compose.yml up -d --build
    fi
    
    log_success "Services started!"
}

# Check service health
check_health() {
    log_info "Checking service health..."
    
    local max_retries=30
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        if curl -sf http://localhost:8000/api/v1/health > /dev/null 2>&1; then
            log_success "Backend is healthy!"
            break
        fi
        retry=$((retry + 1))
        sleep 2
    done
    
    if [ $retry -eq $max_retries ]; then
        log_error "Backend health check failed"
        exit 1
    fi
}

# Show status
show_status() {
    echo ""
    log_info "Deployment Status:"
    echo ""
    echo "  Frontend:  http://localhost:3000"
    echo "  Backend:   http://localhost:8000"
    echo "  API Docs:  http://localhost:8000/docs"
    echo "  ChromaDB:  http://localhost:8001"
    echo ""
    log_info "Run 'docker-compose logs -f' to view logs"
}

# Main
main() {
    echo ""
    echo "============================================"
    echo " AI Agent Production System - Deployment"
    echo "============================================"
    echo ""
    
    local profile="${1:-development}"
    
    check_prerequisites
    setup_env
    start_services "$profile"
    
    if [ "$profile" != "production" ]; then
        check_health
    fi
    
    show_status
}

main "$@"
