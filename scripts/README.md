# ChainEquity Scripts

Automation and utility scripts for ChainEquity development, testing, and deployment.

## Scripts Overview

### 1. Setup Script (`setup.sh`)

One-command setup for the entire development environment.

**Usage:**
```bash
./scripts/setup.sh
# or
npm run setup
```

**What it does:**
- Checks prerequisites (Node.js, Foundry, Git)
- Creates `.env` from `.env.example`
- Installs root dependencies
- Installs workspace dependencies (backend, frontend, shared, tests)
- Sets up Foundry contracts
- Installs Foundry dependencies
- Builds contracts
- Runs contract tests
- Displays next steps

**Prerequisites:**
- Node.js >= 18.0.0
- npm
- Git
- Foundry (will install if missing)

---

### 2. Demo Script (`demo.ts`)

Automated demonstration of all ChainEquity features.

**Usage:**
```bash
npm run demo
# or
ts-node scripts/demo.ts
```

**Prerequisites:**
```bash
# Start Anvil
anvil

# Deploy contract
npm run deploy:local

# Set contract address
export CONTRACT_ADDRESS=0x... # from deployment
```

**Demo Flow:**

1. **Verify Deployment**
   - Check contract is deployed
   - Display token name and symbol

2. **Setup Wallets**
   - Initialize 3 test wallets (A, B, C)
   - Display addresses

3. **Approve Wallets**
   - Approve Wallet A
   - Approve Wallet B
   - Display approval status

4. **Mint Tokens**
   - Mint 10,000 tokens to Wallet A
   - Display cap table

5. **Transfer (Approved)**
   - Transfer 3,000 tokens from A to B
   - Both wallets approved - succeeds
   - Display updated cap table

6. **Transfer (Blocked)**
   - Attempt transfer from A to C (not approved)
   - Transaction blocked
   - Display error message

7. **Approve Third Wallet**
   - Approve Wallet C
   - Display approval confirmation

8. **Transfer (Now Succeeds)**
   - Transfer 2,000 tokens from A to C
   - Both wallets approved - succeeds
   - Display updated cap table

9. **Execute Stock Split**
   - Execute 7-for-1 split
   - All balances multiplied by 7
   - Display cap table with new balances

10. **Change Symbol**
    - Change symbol from CEQT to CEQX
    - Balances unchanged
    - Display metadata update

11. **Export Cap Table**
    - Display final cap table
    - Show ownership percentages
    - Display current block number

**Output:**

Beautiful console output with:
- Progress indicators
- Success/error messages
- Transaction hashes
- Cap table visualizations
- Ownership percentages

**Idempotency:**

Can be run multiple times on the same Anvil instance. Each run uses fresh transactions.

---

### 3. Gas Benchmarks Script (`gas-benchmarks.ts`)

Analyzes gas consumption and compares against PRD targets.

**Usage:**
```bash
npm run gas-benchmarks
# or
cd contracts && forge test --gas-report > gas-report.txt && cd .. && ts-node scripts/gas-benchmarks.ts
```

**PRD Targets:**

| Operation | Target Gas | Description |
|-----------|------------|-------------|
| `mint` | <100k gas | Mint tokens to approved wallet |
| `approveWallet` | <50k gas | Approve wallet for transfers |
| `transfer` | <100k gas | Transfer between approved wallets |
| `revokeWallet` | <50k gas | Revoke wallet approval |
| `executeStockSplit` | <100k gas | Execute stock split (multiplier) |
| `changeSymbol` | <50k gas | Change token symbol |

**What it does:**
- Parses Foundry gas report
- Compares actual vs. target gas
- Generates console report
- Creates markdown report in `docs/gas-benchmarks.md`
- Provides optimization recommendations
- Exits with error if targets exceeded

**Output:**

Console table:
```
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
```

Markdown report includes:
- Summary (passed/failed/warnings)
- Detailed results table
- PRD compliance section
- Optimization recommendations
- Implementation notes

**Exit Codes:**
- `0` - All operations meet targets
- `1` - One or more operations exceed targets

---

### 4. Health Check Script (`health-check.ts`)

Verifies all ChainEquity components are running correctly.

**Usage:**
```bash
npm run health-check
# or
ts-node scripts/health-check.ts
```

**Checks Performed:**

1. **Project Structure**
   - Verifies required directories exist
   - Checks: contracts, backend, frontend, shared, tests, scripts

2. **Environment Variables**
   - Checks `.env` configuration
   - Required: POLYGON_RPC_URL, PRIVATE_KEY

3. **RPC Connection**
   - Tests blockchain RPC endpoint
   - Displays current block number

4. **Contract Deployment**
   - Verifies contract deployed at CONTRACT_ADDRESS
   - Reads contract metadata (name, symbol)

5. **Backend API**
   - Checks backend server responding
   - Endpoint: `http://localhost:3001/health`

6. **Frontend**
   - Checks frontend server running
   - Endpoint: `http://localhost:3000`

7. **Database**
   - Verifies indexer database exists
   - Displays database size

8. **Indexer**
   - Checks indexer has indexed data
   - Queries cap table endpoint

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
│ Backend API              │ ⚠️ WARN│ Backend API not running         │
│ Frontend                 │ ⚠️ WARN│ Frontend not running            │
│ Database                 │ ✅ PASS│ Size: 128.45 KB                 │
│ Indexer                  │ ✅ PASS│ Cap table has 3 entries         │
└──────────────────────────┴────────┴─────────────────────────────────┘

Summary:
  ✅ Passed: 6/8
  ❌ Failed: 0/8
  ⚠️  Warnings: 2/8
```

**Exit Codes:**
- `0` - All critical checks passed
- `1` - One or more critical checks failed

**Note:** Warnings (⚠️) don't cause failure - only errors (❌) do.

---

## Environment Variables

All scripts respect these environment variables:

```bash
# RPC Endpoints
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology/
ANVIL_RPC_URL=http://127.0.0.1:8545

# Private Keys
PRIVATE_KEY=0x...
RELAYER_PRIVATE_KEY=0x...

# Contract Address
CONTRACT_ADDRESS=0x...

# Server Endpoints
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Backend Config
PORT=3001

# Frontend Config
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Common Workflows

### First Time Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd chain-equity

# 2. Run setup
npm run setup

# 3. Edit .env
cp .env.example .env
# Add your PRIVATE_KEY

# 4. Start Anvil
npm run anvil

# 5. Deploy contract (in new terminal)
npm run deploy:local

# 6. Run demo
export CONTRACT_ADDRESS=0x... # from deployment
npm run demo
```

### Daily Development

```bash
# Start Anvil
npm run anvil

# Start backend and frontend (in new terminal)
npm run dev

# Run health check
npm run health-check

# Run tests
npm test
```

### Before Committing

```bash
# Run all tests
npm test

# Check gas benchmarks
npm run gas-benchmarks

# Health check
npm run health-check
```

### Testnet Deployment

```bash
# Update .env with testnet RPC and private key
# Get testnet tokens from faucet

# Deploy to testnet
npm run deploy

# Update CONTRACT_ADDRESS in .env

# Run health check
npm run health-check

# Run demo on testnet
npm run demo
```

## Troubleshooting

### "Command not found: ts-node"

```bash
npm install
```

### "Cannot connect to RPC"

```bash
# Start Anvil
anvil
```

### "CONTRACT_ADDRESS not found"

```bash
# Deploy contract first
npm run deploy:local

# Set environment variable
export CONTRACT_ADDRESS=0x...
```

### "Permission denied: ./scripts/setup.sh"

```bash
chmod +x ./scripts/setup.sh
```

## Adding New Scripts

1. Create TypeScript file in `scripts/`
2. Add shebang: `#!/usr/bin/env ts-node`
3. Make executable: `chmod +x scripts/your-script.ts`
4. Add to `package.json` scripts section
5. Document in this README

## License

MIT
