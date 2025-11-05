# ChainEquity Testing & Integration Guide

Complete guide to testing, demos, and integration for the ChainEquity tokenized security platform.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Test Suite](#test-suite)
- [Demo Automation](#demo-automation)
- [Gas Benchmarks](#gas-benchmarks)
- [Health Checks](#health-checks)
- [Setup Script](#setup-script)
- [CI/CD Integration](#cicd-integration)

## Overview

ChainEquity includes comprehensive testing and automation infrastructure:

- **E2E Test Suite** - Validates all PRD scenarios
- **Demo Script** - Automated feature demonstration
- **Gas Benchmarks** - PRD compliance verification
- **Health Checks** - System status validation
- **Setup Script** - One-command environment setup

## Quick Start

### Initial Setup

```bash
# 1. Run setup (installs dependencies, builds contracts, runs tests)
npm run setup

# 2. Start local blockchain
npm run anvil

# 3. Deploy contract (in new terminal)
npm run deploy:local
# Save the CONTRACT_ADDRESS from output

# 4. Set environment variable
export CONTRACT_ADDRESS=0x... # from deployment

# 5. Run demo
npm run demo

# 6. Run E2E tests
npm run test:e2e

# 7. Generate gas benchmarks
npm run gas-benchmarks

# 8. Health check
npm run health-check
```

## Test Suite

### E2E Tests (`tests/e2e/`)

Comprehensive end-to-end tests covering all PRD requirements.

**Location:** `/Users/Apple/workspace/gauntlet/chain-equity/tests/e2e/chain-equity.test.ts`

**Test Scenarios:**

1. **Complete Flow: Deploy → Approve → Mint → Transfer**
   - Verify initial contract metadata (name, symbol)
   - Approve Wallet A
   - Mint 10,000 tokens to Wallet A
   - Approve Wallet B
   - Transfer 3,000 tokens from A to B (both approved - succeeds)
   - Verify balances: A=7,000, B=3,000

2. **Transfer to Non-Approved Wallet (Blocked)**
   - Attempt transfer from Wallet A to non-approved Wallet C
   - Verify transaction reverts
   - Verify balances unchanged

3. **Approve Second Wallet → Transfer Succeeds**
   - Approve Wallet C
   - Transfer 2,000 tokens from A to C (both approved - succeeds)
   - Verify balances: A=5,000, B=3,000, C=2,000

4. **Execute 7-for-1 Stock Split**
   - Execute stock split with multiplier=7
   - Verify all balances multiplied by 7
   - Verify total supply multiplied by 7
   - Verify ownership percentages unchanged
   - Final balances: A=35,000, B=21,000, C=14,000

5. **Change Symbol → Verify Metadata Updated**
   - Change symbol from CEQT to CEQX
   - Verify new symbol returned
   - Verify balances unchanged

6. **Export Cap Table at Different Blocks**
   - Query balances for all wallets
   - Calculate ownership percentages
   - Verify: A=50%, B=30%, C=20%
   - Verify percentages sum to 100%

7. **Unauthorized Admin Attempts (Should Fail)**
   - Attempt approve from unauthorized wallet → fails
   - Attempt mint from unauthorized wallet → fails
   - Attempt stock split from unauthorized wallet → fails
   - Attempt symbol change from unauthorized wallet → fails

8. **Additional Scenarios**
   - Revoke wallet approval → transfers fail
   - Verify total supply equals sum of balances

**Running Tests:**

```bash
# All tests
npm run test:e2e

# Watch mode
npm run test:watch

# From tests directory
cd tests
npm test

# Verbose output
npm test -- --reporter=verbose

# Specific test
npm test -- -t "should approve Wallet A"
```

**Configuration:**

```bash
# tests/.env
ANVIL_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x...
```

**Test Accounts (Anvil defaults):**

- Admin: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Wallet A: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Wallet B: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- Wallet C: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- Unauthorized: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`

## Demo Automation

### Automated Demo Script (`scripts/demo.ts`)

Interactive demonstration of all ChainEquity features with beautiful console output.

**Location:** `/Users/Apple/workspace/gauntlet/chain-equity/scripts/demo.ts`

**Features:**

- Step-by-step execution with progress indicators
- Transaction hash logging
- Cap table visualizations
- Success/error messages with emojis
- Ownership percentage calculations

**Running the Demo:**

```bash
# Prerequisites
anvil                           # Start Anvil
npm run deploy:local            # Deploy contract
export CONTRACT_ADDRESS=0x...   # Set contract address

# Run demo
npm run demo
```

**Demo Output Example:**

```
╔═════════════════════════════════════════════════════════════════════╗
║                  ChainEquity Demo Automation                        ║
║          Tokenized Security with Compliance Gating                  ║
╚═════════════════════════════════════════════════════════════════════╝

================================================================================
STEP: 1
================================================================================
Verify Contract Deployment
✅ Contract deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
ℹ️  Token Name: ChainEquity
ℹ️  Token Symbol: CEQT

...

┌─────────────────────────────────────────────┬───────────┬───────────┐
│ Wallet                                      │ Balance   │ Ownership │
├─────────────────────────────────────────────┼───────────┼───────────┤
│ 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 │  35000.0  │    50.00% │
│ 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC │  21000.0  │    30.00% │
│ 0x90F79bf6EB2c4f870365E785982E1f101E93b906 │  14000.0  │    20.00% │
├─────────────────────────────────────────────┼───────────┼───────────┤
│ TOTAL                                       │  70000.0  │   100.00% │
└─────────────────────────────────────────────┴───────────┴───────────┘

╔═════════════════════════════════════════════════════════════════════╗
║                     Demo Completed Successfully!                    ║
╚═════════════════════════════════════════════════════════════════════╝

All features demonstrated:
  ✅ Wallet approval and compliance gating
  ✅ Token minting to approved wallets
  ✅ Transfers between approved wallets
  ✅ Transfer blocking for non-approved wallets
  ✅ 7-for-1 stock split
  ✅ Symbol/ticker change
  ✅ Cap table generation and export
```

**Idempotency:**

The demo can be run multiple times on the same Anvil instance. Each run creates new transactions.

## Gas Benchmarks

### Gas Analysis Script (`scripts/gas-benchmarks.ts`)

Analyzes gas consumption and compares against PRD targets.

**Location:** `/Users/Apple/workspace/gauntlet/chain-equity/scripts/gas-benchmarks.ts`

**PRD Gas Targets:**

| Operation | Target | Description |
|-----------|--------|-------------|
| Mint | <100k gas | Mint tokens to approved wallet |
| Approve Wallet | <50k gas | Approve wallet for transfers |
| Transfer | <100k gas | Transfer between approved wallets |
| Revoke Wallet | <50k gas | Revoke wallet approval |
| Stock Split | <100k gas | Execute stock split (multiplier optimization) |
| Symbol Change | <50k gas | Change token symbol |

**Running Benchmarks:**

```bash
# Generate gas report and analyze
npm run gas-benchmarks

# Manual steps
cd contracts
forge test --gas-report > gas-report.txt
cd ..
ts-node scripts/gas-benchmarks.ts
```

**Output:**

Console report:
```
╔═════════════════════════════════════════════════════════════════════╗
║                     Gas Benchmarks Report                           ║
╚═════════════════════════════════════════════════════════════════════╝

┌──────────────────────┬─────────────┬─────────────┬────────┐
│ Operation            │ Actual Gas  │ Target Gas  │ Status │
├──────────────────────┼─────────────┼─────────────┼────────┤
│ mint                 │      85,432 │     100,000 │ ✅     │
│ approveWallet        │      42,156 │      50,000 │ ✅     │
│ transfer             │      89,234 │     100,000 │ ✅     │
│ revokeWallet         │      35,678 │      50,000 │ ✅     │
│ executeStockSplit    │      72,145 │     100,000 │ ✅     │
│ changeSymbol         │      38,912 │      50,000 │ ✅     │
└──────────────────────┴─────────────┴─────────────┴────────┘

Summary:
  ✅ Passed: 6/6
  ❌ Failed: 0/6
  ⚠️  Warnings: 0/6

✅ Report saved to: docs/gas-benchmarks.md
✅ All operations meet gas targets
```

**Markdown Report:**

Generated at `/Users/Apple/workspace/gauntlet/chain-equity/docs/gas-benchmarks.md`

Includes:
- Summary (passed/failed/warnings)
- Detailed results table
- PRD compliance verification
- Optimization recommendations
- Implementation notes

**Exit Codes:**
- `0` - All operations meet targets
- `1` - One or more operations exceed targets

## Health Checks

### System Health Check (`scripts/health-check.ts`)

Comprehensive health check for all ChainEquity components.

**Location:** `/Users/Apple/workspace/gauntlet/chain-equity/scripts/health-check.ts`

**Checks Performed:**

1. **Project Structure** - Verifies all required directories exist
2. **Environment Variables** - Checks .env configuration
3. **RPC Connection** - Tests blockchain endpoint
4. **Contract Deployment** - Verifies contract deployed and responding
5. **Backend API** - Checks backend server health
6. **Frontend** - Verifies frontend is running
7. **Database** - Checks indexer database exists
8. **Indexer** - Verifies indexer has data

**Running Health Check:**

```bash
npm run health-check
```

**Output:**

```
╔═════════════════════════════════════════════════════════════════════╗
║                    ChainEquity Health Check                         ║
╚═════════════════════════════════════════════════════════════════════╝

┌──────────────────────────┬────────┬─────────────────────────────────┐
│ Component                │ Status │ Details                         │
├──────────────────────────┼────────┼─────────────────────────────────┤
│ Project Structure        │ ✅ PASS│ All required directories pres.. │
│ Environment              │ ✅ PASS│ All required env vars set       │
│ RPC Connection           │ ✅ PASS│ Current block: 12345            │
│ Contract Deployment      │ ✅ PASS│ Token: ChainEquity at 0x...     │
│ Backend API              │ ✅ PASS│ Status: healthy                 │
│ Frontend                 │ ✅ PASS│ Available at http://...         │
│ Database                 │ ✅ PASS│ Size: 128.45 KB                 │
│ Indexer                  │ ✅ PASS│ Cap table has 3 entries         │
└──────────────────────────┴────────┴─────────────────────────────────┘

Summary:
  ✅ Passed: 8/8
  ❌ Failed: 0/8
  ⚠️  Warnings: 0/8

✅ Health check passed - all critical components are operational
```

**Exit Codes:**
- `0` - All critical checks passed
- `1` - One or more critical checks failed

**Status Levels:**
- ✅ **PASS** - Component working correctly
- ⚠️ **WARN** - Component not critical or optional
- ❌ **FAIL** - Critical component not working

## Setup Script

### One-Command Setup (`scripts/setup.sh`)

Automated setup for the entire development environment.

**Location:** `/Users/Apple/workspace/gauntlet/chain-equity/scripts/setup.sh`

**What it does:**

1. **Check Prerequisites**
   - Node.js >= 18.0.0
   - npm
   - Git
   - Foundry (installs if missing)

2. **Setup Environment**
   - Creates `.env` from `.env.example`
   - Prompts for manual configuration

3. **Install Dependencies**
   - Root dependencies
   - Backend dependencies
   - Frontend dependencies
   - Shared dependencies
   - Test dependencies

4. **Setup Contracts**
   - Initialize Foundry if needed
   - Install Foundry dependencies
   - Build contracts

5. **Run Tests**
   - Execute contract test suite
   - Verify everything works

6. **Display Next Steps**
   - Configuration instructions
   - Development commands
   - Deployment instructions

**Running Setup:**

```bash
# Make executable (first time only)
chmod +x scripts/setup.sh

# Run setup
./scripts/setup.sh
# or
npm run setup
```

**Prerequisites:**

- macOS, Linux, or WSL
- Bash shell
- Internet connection

## CI/CD Integration

### GitHub Actions Example

```yaml
name: ChainEquity CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Run Setup
        run: npm run setup

      - name: Start Anvil
        run: anvil &

      - name: Deploy Contract
        run: |
          cd contracts
          forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast
          # Extract contract address from deployment output

      - name: Run Contract Tests
        run: npm run test:contracts

      - name: Run E2E Tests
        run: npm run test:e2e
        env:
          CONTRACT_ADDRESS: ${{ steps.deploy.outputs.address }}

      - name: Generate Gas Benchmarks
        run: npm run gas-benchmarks

      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: reports
          path: docs/gas-benchmarks.md
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# Run tests
npm test

# Check gas benchmarks
npm run gas-benchmarks

# Health check
npm run health-check

if [ $? -ne 0 ]; then
  echo "Pre-commit checks failed. Commit aborted."
  exit 1
fi

echo "Pre-commit checks passed!"
```

## Available Commands

All commands from project root:

```bash
# Setup
npm run setup              # One-command setup

# Development
npm run anvil              # Start local blockchain
npm run dev                # Start backend + frontend
npm run dev:backend        # Start backend only
npm run dev:frontend       # Start frontend only

# Deployment
npm run deploy:local       # Deploy to Anvil
npm run deploy             # Deploy to testnet

# Testing
npm test                   # Run all tests
npm run test:contracts     # Contract tests only
npm run test:backend       # Backend tests only
npm run test:e2e           # E2E tests only
npm run test:watch         # Watch mode

# Automation
npm run demo               # Run automated demo
npm run gas-benchmarks     # Generate gas report
npm run health-check       # System health check

# Build
npm run build              # Build all components
npm run build:contracts    # Build contracts
npm run build:backend      # Build backend
npm run build:frontend     # Build frontend
```

## Troubleshooting

### Common Issues

**1. "Cannot connect to RPC endpoint"**
```bash
# Start Anvil
anvil
```

**2. "CONTRACT_ADDRESS not found"**
```bash
# Deploy contract
npm run deploy:local
# Set environment variable
export CONTRACT_ADDRESS=0x...
```

**3. "Tests failing"**
```bash
# Check Anvil is running
# Check contract is deployed
# Check environment variables are set
npm run health-check
```

**4. "Permission denied: setup.sh"**
```bash
chmod +x scripts/setup.sh
```

**5. "ts-node not found"**
```bash
npm install
```

### Debug Mode

```bash
# Verbose test output
npm test -- --reporter=verbose

# Anvil verbose logs
anvil --block-time 1 --gas-limit 30000000

# Backend debug logs
DEBUG=* npm run dev:backend
```

## Best Practices

1. **Always run health check** before starting development
2. **Run setup** after pulling new code
3. **Check gas benchmarks** before committing
4. **Run demo** to verify end-to-end functionality
5. **Use Anvil** for local development
6. **Test on testnet** before mainnet consideration

## Documentation

- **README.md** - Project overview
- **PRD.md** - Product requirements
- **TESTING.md** - This file
- **tests/README.md** - E2E test documentation
- **scripts/README.md** - Scripts documentation
- **docs/** - Additional documentation

## Support

For questions or issues:
- Check troubleshooting section above
- Review script READMEs
- Check Anvil logs
- Consult PRD.md

## License

MIT
