# ChainEquity Quick Start Guide

Get up and running with ChainEquity in 5 minutes.

## Prerequisites

- Node.js >= 18.0.0
- Git
- Terminal/Command Line

## Setup (First Time)

### 1. One-Command Setup

```bash
npm run setup
```

This will:
- Check prerequisites (installs Foundry if needed)
- Install all dependencies
- Build contracts
- Run tests
- Display next steps

### 2. Configure Environment

```bash
# Edit .env file
nano .env

# Add your private key (for testnet deployment)
PRIVATE_KEY=0x...
```

For local development, you can skip this step.

## Local Development

### 1. Start Local Blockchain

```bash
# Terminal 1
npm run anvil
```

Keep this running. You'll see Anvil start with 10 test accounts.

### 2. Deploy Contract

```bash
# Terminal 2
npm run deploy:local
```

**Important:** Copy the contract address from the output:
```
Deployed ChainEquity at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 3. Set Environment Variable

```bash
# Terminal 2
export CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Replace with your actual deployed address.

### 4. Run Demo

```bash
# Terminal 2
npm run demo
```

You'll see:
- Step-by-step execution
- Cap table visualizations
- All features demonstrated
- Success confirmations

### 5. Run Tests

```bash
# Run all tests
npm test

# Just E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

### 6. Start Application

```bash
# Terminal 3
npm run dev
```

This starts:
- Backend: http://localhost:3001
- Frontend: http://localhost:3000

### 7. Verify Everything Works

```bash
# Terminal 2
npm run health-check
```

Should show all components passing.

## Quick Reference

### Essential Commands

```bash
# Start local blockchain
npm run anvil

# Deploy locally
npm run deploy:local

# Run demo
npm run demo

# Run tests
npm test

# Start app
npm run dev

# Health check
npm run health-check

# Gas benchmarks
npm run gas-benchmarks
```

### Test Accounts (Anvil)

When Anvil starts, use these accounts:

- **Account 0 (Admin):** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Account 1:** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Account 2:** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

Each has 10,000 ETH for testing.

### Environment Variables

```bash
# For demo and tests
export CONTRACT_ADDRESS=0x...

# For deployment
export PRIVATE_KEY=0x...
export POLYGON_RPC_URL=https://rpc-amoy.polygon.technology/
```

## Testnet Deployment (Optional)

### 1. Get Testnet Tokens

Visit: https://faucet.polygon.technology/

Request MATIC for your deployer address.

### 2. Configure Environment

```bash
# .env
PRIVATE_KEY=0x...  # Your actual private key
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology/
```

### 3. Deploy to Testnet

```bash
npm run deploy
```

### 4. Update Environment

```bash
# .env
CONTRACT_ADDRESS=0x...  # From deployment output
```

### 5. Run Demo on Testnet

```bash
npm run demo
```

## What Each Script Does

### `npm run demo`
Runs automated demonstration:
- Approves wallets
- Mints tokens
- Executes transfers
- Performs stock split
- Changes symbol
- Shows cap table

### `npm test`
Runs all tests:
- Contract tests (Foundry)
- Backend tests
- E2E tests

### `npm run gas-benchmarks`
Analyzes gas consumption:
- Compares against PRD targets
- Generates report
- Shows pass/fail status

### `npm run health-check`
Verifies system status:
- RPC connection
- Contract deployment
- Backend/frontend running
- Database initialized

## Troubleshooting

### "Cannot connect to RPC"

**Solution:** Start Anvil first
```bash
npm run anvil
```

### "CONTRACT_ADDRESS not found"

**Solution:** Deploy contract and set variable
```bash
npm run deploy:local
export CONTRACT_ADDRESS=0x...
```

### "Permission denied: setup.sh"

**Solution:** Make script executable
```bash
chmod +x scripts/setup.sh
```

### "Tests failing"

**Solution:** Run health check
```bash
npm run health-check
```

## Next Steps

1. **Read the Documentation**
   - `TESTING.md` - Comprehensive testing guide
   - `PRD.md` - Product requirements
   - `tests/README.md` - Test documentation
   - `scripts/README.md` - Scripts documentation

2. **Explore the Code**
   - `contracts/` - Smart contracts
   - `backend/` - Backend API and indexer
   - `frontend/` - Web interface
   - `tests/e2e/` - E2E tests

3. **Try Different Scenarios**
   - Modify demo script
   - Add new tests
   - Experiment with features

4. **Deploy to Testnet**
   - Get testnet tokens
   - Deploy contract
   - Run demo on testnet

## Common Workflows

### Daily Development

```bash
# Terminal 1: Start Anvil
npm run anvil

# Terminal 2: Deploy and demo
npm run deploy:local
export CONTRACT_ADDRESS=0x...
npm run demo

# Terminal 3: Start app
npm run dev
```

### Before Committing

```bash
# Run all tests
npm test

# Check gas benchmarks
npm run gas-benchmarks

# Verify health
npm run health-check
```

### After Pulling New Code

```bash
# Re-run setup
npm run setup

# Restart services
npm run anvil  # Terminal 1
npm run dev    # Terminal 2
```

## Help & Support

- **Documentation:** Check `docs/` directory
- **Logs:** Check Anvil terminal for transaction details
- **Debug:** Use `--reporter=verbose` with tests

## Full Development Cycle

Here's a complete example from start to finish:

```bash
# 1. Setup (first time only)
npm run setup

# 2. Start blockchain
npm run anvil

# 3. Deploy contract (new terminal)
npm run deploy:local
# Copy: Deployed ChainEquity at: 0x5FbDB...

# 4. Set contract address
export CONTRACT_ADDRESS=0x5FbDB...

# 5. Run demo
npm run demo
# Watch beautiful output showing all features

# 6. Run tests
npm test
# All tests should pass

# 7. Check gas usage
npm run gas-benchmarks
# Verify all operations meet targets

# 8. Start application (new terminal)
npm run dev
# Backend at :3001, Frontend at :3000

# 9. Verify everything
npm run health-check
# All components should pass

# 10. Open browser
open http://localhost:3000
```

Done! You now have a fully functional ChainEquity instance.

## Tips

- **Keep Anvil running** in a dedicated terminal
- **Set CONTRACT_ADDRESS** after each deployment
- **Run health-check** when something doesn't work
- **Check Anvil logs** for transaction details
- **Use demo script** to verify features work

## Summary

ChainEquity is now ready to use! You can:

✅ Deploy contracts locally or to testnet
✅ Run automated demos
✅ Execute comprehensive tests
✅ Monitor gas consumption
✅ Verify system health
✅ Develop new features

For detailed information, see `TESTING.md`.

Happy coding!
