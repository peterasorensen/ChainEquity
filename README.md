# ChainEquity

**Tokenized Security Prototype with Compliance Gating**

> **DISCLAIMER**: This is a technical prototype for educational and demonstration purposes only. This system is NOT production-ready, NOT regulatory-compliant, and should NOT be used for real securities without proper legal review, KYC/AML compliance, and regulatory approval. Use testnet only.

## Overview

ChainEquity demonstrates how blockchain technology can modernize equity management for private companies by providing:

- **Instant Settlement**: Transfers settle immediately on-chain vs. traditional T+2 settlement
- **Transparent Ownership**: All transfers are auditable and ownership is always verifiable
- **Automated Compliance**: Transfer restrictions enforced programmatically via allowlist
- **Corporate Actions**: Stock splits and symbol changes executed on-chain
- **Real-time Cap Tables**: Ownership snapshots available at any block height

This prototype showcases the core mechanics of tokenized securities without relying on black-box SaaS solutions.

## Features

### Core Functionality

- **Gated Token Contract**: ERC-20 token with allowlist-based transfer restrictions
  - Only approved wallets can send/receive tokens
  - Admin controls for allowlist management
  - Complete event logging for all operations

- **Issuer Service**: Backend API for operator workflows
  - Approve/deny wallet addresses (KYC mock)
  - Mint tokens to approved wallets
  - Query allowlist status
  - Trigger corporate actions
  - Gasless relayer for improved UX

- **Event Indexer**: Real-time blockchain event monitoring
  - Maintains current balance per wallet
  - Generates cap-table snapshots at any block height
  - Exports ownership data in CSV/JSON format

- **Corporate Actions**:
  - **Stock Split (7-for-1)**: Multiplies all balances while maintaining ownership percentages
  - **Symbol Change**: Updates token ticker while preserving all balances

- **Operator UI**: Web interface for demonstrations
  - Wallet approval management
  - Token minting and transfers
  - Execute corporate actions
  - View and export cap-table

### Technical Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│              TypeScript + React + CSS Modules               │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────┴───────────────────────────────────┐
│              Backend (Node.js + Express)                     │
│         Viem + SQLite + Event Indexer + Relayer            │
└─────────────────────────┬───────────────────────────────────┘
                          │ JSON-RPC
┌─────────────────────────┴───────────────────────────────────┐
│           Polygon Amoy Testnet (EVM Compatible)             │
│                   GatedToken.sol (ERC-20)                    │
└─────────────────────────────────────────────────────────────┘
```

## Architecture

```
┌─────────────┐
│   Operator  │
│     UI      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│              Backend Service                         │
│  ┌────────────┐  ┌──────────┐  ┌────────────┐     │
│  │   Admin    │  │  Event   │  │  Relayer   │     │
│  │   API      │  │ Indexer  │  │  Service   │     │
│  └────────────┘  └──────────┘  └────────────┘     │
│                      │                              │
│                      ▼                              │
│              ┌──────────────┐                       │
│              │   SQLite DB  │                       │
│              │  (Cap Table) │                       │
│              └──────────────┘                       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │  Polygon Amoy Testnet │
           │   GatedToken.sol      │
           └───────────────────────┘
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **Foundry** (for smart contracts) - Install via:
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```
- **Git** (for cloning the repository)
- **Polygon Amoy Testnet** wallet with test MATIC
  - Get test MATIC from [Polygon Faucet](https://faucet.polygon.technology/)

## Quick Start

### One-Command Setup

```bash
# Clone the repository
git clone <repository-url>
cd chain-equity

# Install all dependencies
npm run setup
```

This will:
1. Install all Node.js dependencies for backend, frontend, and shared packages
2. Install Foundry dependencies for smart contracts

### Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and configure the following variables:

```bash
# Polygon Amoy Testnet RPC endpoint
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology/

# Deployer/admin wallet private key (get test MATIC from faucet)
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Relayer wallet private key (for gasless transactions)
RELAYER_PRIVATE_KEY=0xYOUR_RELAYER_PRIVATE_KEY_HERE

# Backend server port
PORT=3001

# Frontend API endpoint
NEXT_PUBLIC_API_URL=http://localhost:3001

# Contract address (filled after deployment)
CONTRACT_ADDRESS=

# Optional: PolygonScan API key for contract verification
POLYGONSCAN_API_KEY=
```

**Important**: Never commit real private keys. Use testnet wallets only.

### Deploy Smart Contracts

Deploy the GatedToken contract to Polygon Amoy testnet:

```bash
npm run deploy
```

After deployment:
1. Copy the contract address from the output
2. Add it to your `.env` file as `CONTRACT_ADDRESS`
3. The deployment will be logged with transaction hash

### Run the Application

#### Development Mode (All Services)

Start backend and frontend concurrently:

```bash
npm run dev
```

This will start:
- Backend API on `http://localhost:3001`
- Frontend UI on `http://localhost:3000`
- Event indexer (automatic)

#### Run Services Individually

**Backend only**:
```bash
npm run dev:backend
```

**Frontend only**:
```bash
npm run dev:frontend
```

### Run Tests

**All tests**:
```bash
npm test
```

**Smart contract tests only**:
```bash
npm run test:contracts
```

**Backend tests only**:
```bash
npm run test:backend
```

### Build for Production

```bash
npm run build
```

Builds:
- Smart contracts
- Backend service
- Frontend application

## Usage Examples

### Demo Flow

1. **Access the UI**: Open `http://localhost:3000` in your browser

2. **Approve a Wallet**:
   - Navigate to "Manage Allowlist"
   - Enter wallet address
   - Click "Approve Wallet"

3. **Mint Tokens**:
   - Navigate to "Mint Tokens"
   - Enter approved wallet address and amount
   - Click "Mint"

4. **Transfer Tokens**:
   - Between approved wallets: SUCCESS
   - To non-approved wallet: BLOCKED

5. **Execute Stock Split**:
   - Navigate to "Corporate Actions"
   - Click "Execute 7-for-1 Split"
   - Verify all balances multiplied by 7

6. **Change Symbol**:
   - Navigate to "Corporate Actions"
   - Enter new symbol (e.g., "ACMEX")
   - Click "Change Symbol"

7. **View Cap Table**:
   - Navigate to "Cap Table"
   - View current ownership distribution
   - Export as CSV or JSON

### API Examples

**Approve Wallet**:
```bash
curl -X POST http://localhost:3001/api/admin/approve \
  -H "Content-Type: application/json" \
  -d '{"address": "0x1234..."}'
```

**Mint Tokens**:
```bash
curl -X POST http://localhost:3001/api/admin/mint \
  -H "Content-Type: application/json" \
  -d '{"to": "0x1234...", "amount": "1000"}'
```

**Get Cap Table**:
```bash
curl http://localhost:3001/api/cap-table
```

**Execute Stock Split**:
```bash
curl -X POST http://localhost:3001/api/corporate/split \
  -H "Content-Type: application/json" \
  -d '{"multiplier": 7}'
```

See [API Documentation](docs/API.md) for complete endpoint reference.

## Project Structure

```
chain-equity/
├── contracts/              # Smart contracts (Foundry)
│   ├── src/
│   │   └── GatedToken.sol # Main ERC-20 token with allowlist
│   ├── test/              # Contract unit tests
│   └── script/            # Deployment scripts
├── backend/               # Node.js + Express backend
│   └── src/
│       ├── api/          # REST API endpoints
│       ├── indexer/      # Event listener & cap-table generator
│       ├── relayer/      # Gasless transaction service
│       └── db/           # SQLite database
├── frontend/              # Next.js application
│   └── src/
│       ├── app/          # Next.js 13+ app directory
│       ├── components/   # React components
│       └── styles/       # CSS modules
├── shared/                # Shared types and utilities
│   └── types/            # TypeScript type definitions
├── docs/                  # Documentation
│   ├── TECHNICAL_WRITEUP.md
│   ├── DECISIONS.md
│   ├── API.md
│   ├── GAS_REPORT.md
│   └── TEST_RESULTS.md
├── .env.example          # Environment variables template
└── package.json          # Root package configuration
```

## Key Technical Decisions

### Why Polygon Amoy?
- **Low Gas Costs**: ~100x cheaper than Ethereum mainnet
- **Fast Finality**: 2-second block times
- **EVM Compatible**: Use standard Solidity and tooling
- **Active Testnet**: Free test MATIC, well-supported

### Why Foundry over Hardhat?
- **Performance**: 10-100x faster test execution
- **Gas Reports**: Built-in gas profiling
- **Fuzzing**: Property-based testing support
- **Simplicity**: Pure Solidity tests, no JavaScript

### Why Viem over Ethers?
- **Modern API**: Better TypeScript support
- **Performance**: Smaller bundle, faster execution
- **Type Safety**: Excellent type inference
- **Tree-Shakeable**: Modular imports

### Stock Split Implementation
**Approach**: Stored multiplier (virtual split)
- Balances remain unchanged on-chain
- Display logic applies 7x multiplier
- **Pros**: Zero gas cost, instant execution
- **Cons**: Requires UI/indexer awareness

**Alternatives Considered**:
- Iterate and update all balances (high gas cost)
- Deploy new contract and migrate (complex, risky)

### Symbol Change Implementation
**Approach**: Mutable storage
- Update string variable in contract
- Emit event for indexers
- **Pros**: Simple, low gas, preserves state
- **Cons**: Requires mutable metadata

See [Technical Writeup](docs/TECHNICAL_WRITEUP.md) for detailed rationale.

## Known Limitations

### Not Production-Ready

This is a prototype demonstrating technical concepts. It lacks:

- **No KYC/AML Compliance**: Mock approval system only
- **No Regulatory Compliance**: Not SEC/regulatory compliant
- **Simple Admin Controls**: Single-key admin (no multi-sig)
- **No Audit**: Smart contracts not professionally audited
- **Testnet Only**: Not battle-tested on mainnet
- **No Privacy**: All transactions public on-chain
- **Limited Error Handling**: Minimal production safeguards

### Before Production Use

Would require:
- Professional smart contract audit
- Multi-signature admin controls
- KYC/AML provider integration
- Legal and regulatory review
- Comprehensive monitoring and alerting
- Incident response procedures
- Proper key management (HSM)
- Insurance and legal protections

## Gas Costs

See [Gas Report](docs/GAS_REPORT.md) for detailed benchmarks.

| Operation | Target | Actual | Status |
|-----------|--------|--------|--------|
| Mint tokens | <100k gas | ~TBD | TBD |
| Approve wallet | <50k gas | ~TBD | TBD |
| Transfer (gated) | <100k gas | ~TBD | TBD |
| Revoke approval | <50k gas | ~TBD | TBD |
| Stock split | <50k gas | ~TBD | TBD |
| Symbol change | <50k gas | ~TBD | TBD |

## Testing

See [Test Results](docs/TEST_RESULTS.md) for complete test coverage.

Required test scenarios:
- Approve wallet → Mint tokens → Verify balance
- Transfer between approved wallets → SUCCESS
- Transfer to non-approved wallet → FAIL
- Transfer from non-approved wallet → FAIL
- Revoke approval → Transfers blocked
- 7-for-1 split → Balances multiply by 7
- Symbol change → Metadata updates
- Cap-table export accuracy
- Unauthorized admin actions → FAIL

## Troubleshooting

### Common Issues

**Deployment fails with "insufficient funds"**:
- Get test MATIC from [Polygon Faucet](https://faucet.polygon.technology/)
- Ensure your deployer wallet has at least 0.1 MATIC

**Backend can't connect to contract**:
- Verify `CONTRACT_ADDRESS` is set in `.env`
- Check `POLYGON_RPC_URL` is accessible
- Ensure contract is deployed to Amoy testnet

**Frontend shows "Network error"**:
- Verify backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `.env`
- Review browser console for CORS errors

**Transactions fail with "execution reverted"**:
- Check wallet is on allowlist
- Verify recipient is approved
- Ensure sufficient token balance
- Review transaction revert reason in logs

## Contributing

This is a prototype project. For questions or issues:

Contact: Bryce Harris - bharris@peak6.com

## Further Reading

- [Technical Writeup](docs/TECHNICAL_WRITEUP.md) - Detailed architectural decisions
- [Decision Log](docs/DECISIONS.md) - Chronological record of major choices
- [API Documentation](docs/API.md) - Complete REST API reference
- [Cap Table Guide](cap_table_info.md) - Understanding cap tables
- [PRD](PRD.md) - Original product requirements

## License

This project is for educational and demonstration purposes only.

---

**Built as a technical demonstration of blockchain-based equity management.**
