#!/bin/bash
set -e

# ChainEquity Setup Script
# Sets up the entire development environment with one command

echo "╔═════════════════════════════════════════════════════════════════════╗"
echo "║                  ChainEquity Setup Script                           ║"
echo "║         Tokenized Security with Compliance Gating                   ║"
echo "╚═════════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_step() {
    echo -e "${BLUE}==>${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js >= 18.0.0"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18 or higher is required (found: $(node -v))"
        exit 1
    fi
    log_success "Node.js $(node -v) found"

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    log_success "npm $(npm -v) found"

    # Check Foundry
    if ! command -v forge &> /dev/null; then
        log_warn "Foundry not found. Installing Foundry..."
        curl -L https://foundry.paradigm.xyz | bash
        foundryup
    fi
    log_success "Foundry (forge $(forge --version | head -n1 | awk '{print $3}')) found"

    # Check Git
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed"
        exit 1
    fi
    log_success "Git found"

    echo ""
}

# Setup environment variables
setup_env() {
    log_step "Setting up environment variables..."

    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            log_success "Created .env from .env.example"
            log_warn "Please edit .env and add your configuration"
        else
            log_error ".env.example not found"
            exit 1
        fi
    else
        log_success ".env already exists"
    fi

    echo ""
}

# Install root dependencies
install_root_deps() {
    log_step "Installing root dependencies..."

    npm install
    log_success "Root dependencies installed"

    echo ""
}

# Install workspace dependencies
install_workspace_deps() {
    log_step "Installing workspace dependencies (backend, frontend, shared, tests)..."

    # Backend
    if [ -d "backend" ]; then
        cd backend
        if [ -f "package.json" ]; then
            npm install
            log_success "Backend dependencies installed"
        fi
        cd ..
    fi

    # Frontend
    if [ -d "frontend" ]; then
        cd frontend
        if [ -f "package.json" ]; then
            npm install
            log_success "Frontend dependencies installed"
        fi
        cd ..
    fi

    # Shared
    if [ -d "shared" ]; then
        cd shared
        if [ -f "package.json" ]; then
            npm install
            log_success "Shared dependencies installed"
        fi
        cd ..
    fi

    # Tests
    if [ -d "tests" ]; then
        cd tests
        if [ -f "package.json" ]; then
            npm install
            log_success "Test dependencies installed"
        fi
        cd ..
    fi

    echo ""
}

# Setup Foundry contracts
setup_contracts() {
    log_step "Setting up Foundry contracts..."

    if [ ! -d "contracts" ]; then
        log_error "contracts directory not found"
        exit 1
    fi

    cd contracts

    # Initialize Foundry if needed
    if [ ! -f "foundry.toml" ]; then
        forge init --no-commit
        log_success "Initialized Foundry project"
    fi

    # Install dependencies
    if [ -f "foundry.toml" ]; then
        forge install
        log_success "Foundry dependencies installed"
    fi

    # Build contracts
    log_step "Building contracts..."
    forge build
    log_success "Contracts built successfully"

    cd ..
    echo ""
}

# Run contract tests
run_contract_tests() {
    log_step "Running contract tests..."

    cd contracts

    if forge test; then
        log_success "All contract tests passed"
    else
        log_error "Some contract tests failed"
        cd ..
        exit 1
    fi

    cd ..
    echo ""
}

# Initialize databases
init_databases() {
    log_step "Initializing databases..."

    # Check if backend has database initialization script
    if [ -d "backend/src" ]; then
        log_success "Database will be initialized on first backend run"
    else
        log_warn "Backend not fully set up yet"
    fi

    echo ""
}

# Display next steps
display_next_steps() {
    echo ""
    echo "╔═════════════════════════════════════════════════════════════════════╗"
    echo "║                    Setup Complete!                                  ║"
    echo "╚═════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Configure your environment:"
    echo "   ${BLUE}Edit .env file with your configuration${NC}"
    echo "   - Add PRIVATE_KEY for contract deployment"
    echo "   - Add RPC_URL for your target network"
    echo ""
    echo "2. Start local development:"
    echo "   ${BLUE}# Start Anvil (local testnet)${NC}"
    echo "   anvil"
    echo ""
    echo "   ${BLUE}# In a new terminal, deploy contracts${NC}"
    echo "   cd contracts && forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast"
    echo ""
    echo "   ${BLUE}# Start backend and frontend${NC}"
    echo "   npm run dev"
    echo ""
    echo "3. Run tests:"
    echo "   ${BLUE}# Contract tests${NC}"
    echo "   npm run test:contracts"
    echo ""
    echo "   ${BLUE}# E2E tests${NC}"
    echo "   npm run test:e2e"
    echo ""
    echo "   ${BLUE}# All tests${NC}"
    echo "   npm test"
    echo ""
    echo "4. Run demo:"
    echo "   ${BLUE}npm run demo${NC}"
    echo ""
    echo "5. Generate gas benchmarks:"
    echo "   ${BLUE}npm run gas-benchmarks${NC}"
    echo ""
    echo "6. Health check:"
    echo "   ${BLUE}npm run health-check${NC}"
    echo ""
    echo "For testnet deployment:"
    echo "   - Get testnet tokens from faucet:"
    echo "     ${BLUE}https://faucet.polygon.technology/${NC}"
    echo "   - Update .env with Polygon Amoy RPC URL"
    echo "   - Run: ${BLUE}npm run deploy${NC}"
    echo ""
    echo "Documentation:"
    echo "   - README.md - Project overview"
    echo "   - PRD.md - Product requirements"
    echo "   - docs/ - Additional documentation"
    echo ""
}

# Main execution
main() {
    # Get script directory
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

    cd "$PROJECT_ROOT"

    # Run setup steps
    check_prerequisites
    setup_env
    install_root_deps
    install_workspace_deps
    setup_contracts
    run_contract_tests
    init_databases
    display_next_steps
}

# Run main function
main
