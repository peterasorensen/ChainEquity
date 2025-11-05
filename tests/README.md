# ChainEquity E2E Test Suite

End-to-end tests for the ChainEquity tokenized security platform.

## Overview

This test suite validates all core functionality specified in the PRD:

1. Complete flow: deploy → approve wallet → mint → transfer
2. Transfer blocking for non-approved wallets
3. Wallet approval and transfer success
4. 7-for-1 stock split execution
5. Symbol/ticker changes
6. Cap table generation at different blocks
7. Unauthorized admin access prevention

## Prerequisites

- Node.js >= 18.0.0
- Anvil (local Ethereum testnet) running
- Contract deployed to Anvil

## Installation

```bash
npm install
```

## Running Tests

### Start Anvil

In a separate terminal:

```bash
anvil
```

### Deploy Contract

```bash
cd ../contracts
forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast
```

Copy the deployed contract address and set it in your environment:

```bash
export CONTRACT_ADDRESS=0x... # from deployment output
```

### Run E2E Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Run from Root

```bash
# From project root
npm run test:e2e
```

## Test Structure

```
tests/
├── e2e/
│   └── chain-equity.test.ts  # Main E2E test suite
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Test Scenarios

### 1. Complete Flow
- Deploy contract with initial metadata
- Approve Wallet A
- Mint 10,000 tokens to Wallet A
- Approve Wallet B
- Transfer 3,000 tokens from A to B
- Verify balances updated correctly

### 2. Transfer Blocking
- Attempt transfer from approved Wallet A to non-approved Wallet C
- Verify transaction reverts
- Verify balances unchanged

### 3. Wallet Approval
- Approve previously blocked Wallet C
- Transfer from Wallet A to Wallet C succeeds
- Verify balances updated

### 4. Stock Split
- Execute 7-for-1 stock split
- Verify all balances multiplied by 7
- Verify total supply updated correctly
- Verify ownership percentages unchanged

### 5. Symbol Change
- Change token symbol from CEQT to CEQX
- Verify metadata updated
- Verify balances unchanged

### 6. Cap Table Export
- Query balances for all wallets
- Calculate ownership percentages
- Verify percentages sum to 100%
- Verify proportional ownership

### 7. Unauthorized Access
- Attempt admin operations from unauthorized wallet
- Verify all operations fail:
  - Approve wallet
  - Mint tokens
  - Execute stock split
  - Change symbol

### 8. Additional Scenarios
- Transfer from revoked wallet fails
- Total supply equals sum of balances

## Configuration

### Environment Variables

```bash
# RPC endpoint (default: http://127.0.0.1:8545)
ANVIL_RPC_URL=http://127.0.0.1:8545

# Deployed contract address (required)
CONTRACT_ADDRESS=0x...
```

### Test Accounts

Uses Anvil default accounts:

- **Admin:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Wallet A:** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Wallet B:** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Wallet C:** `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- **Unauthorized:** `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`

## Debugging

### Verbose Output

```bash
# Run tests with detailed logs
npm test -- --reporter=verbose
```

### Single Test

```bash
# Run specific test file
npm test -- e2e/chain-equity.test.ts

# Run specific test by name
npm test -- -t "should approve Wallet A"
```

### Anvil Logs

Check Anvil terminal for transaction logs and revert reasons.

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Start Anvil
  run: anvil &

- name: Deploy Contract
  run: |
    cd contracts
    forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast

- name: Run E2E Tests
  run: npm run test:e2e
  env:
    CONTRACT_ADDRESS: ${{ steps.deploy.outputs.address }}
```

## Performance

- Full test suite runs in ~30-60 seconds
- Individual tests complete in 1-5 seconds
- Parallel execution disabled for deterministic results

## Troubleshooting

### Contract Not Deployed

```
Error: CONTRACT_ADDRESS not found
```

Solution: Deploy contract and set environment variable.

### RPC Connection Failed

```
Error: Cannot connect to RPC endpoint
```

Solution: Ensure Anvil is running on port 8545.

### Transaction Reverts

Check Anvil logs for detailed revert reasons. Common causes:
- Wallet not approved
- Insufficient balance
- Unauthorized caller

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use descriptive test names
3. Clean up state between tests
4. Document expected behavior
5. Add error cases

## License

MIT
