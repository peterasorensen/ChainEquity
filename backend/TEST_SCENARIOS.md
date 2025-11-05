# Backend Test Scenarios

This document provides step-by-step test scenarios to verify all backend functionality.

## Prerequisites

- Backend server running on `http://localhost:3001`
- Contract deployed on Polygon Amoy
- Three test wallet addresses prepared

## Test Wallets Setup

For these tests, you'll need three Ethereum addresses:
- **WALLET_A**: First test wallet
- **WALLET_B**: Second test wallet
- **WALLET_C**: Third test wallet

Replace these placeholders in the commands below with actual addresses.

## Test Scenario 1: Health Check

### Verify server is running
```bash
curl http://localhost:3001/health
```

**Expected**: Status 200, services all connected

## Test Scenario 2: Wallet Approval Flow

### 2.1 Check initial allowlist status (should be false)
```bash
curl http://localhost:3001/api/allowlist/WALLET_A
```

**Expected**: `approved: false` or not found

### 2.2 Approve WALLET_A
```bash
curl -X POST http://localhost:3001/api/wallets/approve \
  -H "Content-Type: application/json" \
  -d '{"address": "WALLET_A"}'
```

**Expected**: Transaction hash returned, `success: true`

### 2.3 Verify approval (should now be true)
```bash
curl http://localhost:3001/api/allowlist/WALLET_A
```

**Expected**: `approved: true`

### 2.4 Get all allowlisted addresses
```bash
curl http://localhost:3001/api/allowlist
```

**Expected**: WALLET_A in the list

## Test Scenario 3: Token Minting

### 3.1 Try to mint to non-approved wallet (should fail)
```bash
curl -X POST http://localhost:3001/api/tokens/mint \
  -H "Content-Type: application/json" \
  -d '{"to": "WALLET_B", "amount": "1000"}'
```

**Expected**: Transaction may succeed on backend but contract will revert if WALLET_B not approved

### 3.2 Mint tokens to approved wallet
```bash
curl -X POST http://localhost:3001/api/tokens/mint \
  -H "Content-Type: application/json" \
  -d '{"to": "WALLET_A", "amount": "1000"}'
```

**Expected**: `success: true`, transaction hash returned

### 3.3 Check cap table (WALLET_A should have 1000 tokens)
```bash
curl http://localhost:3001/api/cap-table
```

**Expected**: WALLET_A with balance 1000, 100% ownership

### 3.4 Get token info
```bash
curl http://localhost:3001/api/tokens/info
```

**Expected**: Token name, symbol, total supply = 1000

## Test Scenario 4: Multi-Wallet Distribution

### 4.1 Approve WALLET_B
```bash
curl -X POST http://localhost:3001/api/wallets/approve \
  -H "Content-Type: application/json" \
  -d '{"address": "WALLET_B"}'
```

### 4.2 Mint to WALLET_B
```bash
curl -X POST http://localhost:3001/api/tokens/mint \
  -H "Content-Type: application/json" \
  -d '{"to": "WALLET_B", "amount": "500"}'
```

### 4.3 Check updated cap table
```bash
curl http://localhost:3001/api/cap-table
```

**Expected**:
- WALLET_A: 1000 tokens (66.67%)
- WALLET_B: 500 tokens (33.33%)
- Total: 1500 tokens

## Test Scenario 5: Stock Split (7-for-1)

### 5.1 Record current block number
```bash
curl http://localhost:3001/health
```

Note the `lastIndexedBlock` value.

### 5.2 Execute stock split
```bash
curl -X POST http://localhost:3001/api/corporate-actions/split \
  -H "Content-Type: application/json" \
  -d '{"multiplier": 7}'
```

**Expected**: `success: true`, transaction hash

### 5.3 Verify balances multiplied
```bash
curl http://localhost:3001/api/cap-table
```

**Expected**:
- WALLET_A: 7000 tokens (66.67%)
- WALLET_B: 3500 tokens (33.33%)
- Total: 10500 tokens
- Percentages unchanged

## Test Scenario 6: Historical Cap Table

### 6.1 Get current cap table
```bash
curl http://localhost:3001/api/cap-table
```

Save the response.

### 6.2 Get cap table at block BEFORE split
```bash
# Use block number from step 5.1
curl "http://localhost:3001/api/cap-table?blockNumber=BLOCK_NUMBER"
```

**Expected**:
- WALLET_A: 1000 tokens (66.67%)
- WALLET_B: 500 tokens (33.33%)
- Total: 1500 tokens

This verifies time-travel queries work correctly.

## Test Scenario 7: Symbol Change

### 7.1 Get current token info
```bash
curl http://localhost:3001/api/tokens/info
```

Note the current name and symbol.

### 7.2 Change symbol
```bash
curl -X POST http://localhost:3001/api/corporate-actions/rename \
  -H "Content-Type: application/json" \
  -d '{"newName": "ChainEquity Token", "newSymbol": "CEQT"}'
```

**Expected**: `success: true`, transaction hash

### 7.3 Verify symbol changed
```bash
curl http://localhost:3001/api/tokens/info
```

**Expected**: New name and symbol, same total supply

### 7.4 Verify balances unchanged
```bash
curl http://localhost:3001/api/cap-table
```

**Expected**: Same balances as before symbol change

## Test Scenario 8: Wallet Revocation

### 8.1 Approve WALLET_C
```bash
curl -X POST http://localhost:3001/api/wallets/approve \
  -H "Content-Type: application/json" \
  -d '{"address": "WALLET_C"}'
```

### 8.2 Verify approval
```bash
curl http://localhost:3001/api/allowlist/WALLET_C
```

**Expected**: `approved: true`

### 8.3 Revoke WALLET_C
```bash
curl -X POST http://localhost:3001/api/wallets/revoke \
  -H "Content-Type: application/json" \
  -d '{"address": "WALLET_C"}'
```

**Expected**: `success: true`, transaction hash

### 8.4 Verify revocation
```bash
curl http://localhost:3001/api/allowlist/WALLET_C
```

**Expected**: `approved: false`

## Test Scenario 9: Cap Table Export

### 9.1 Export as CSV
```bash
curl http://localhost:3001/api/cap-table/export -o cap-table.csv
```

### 9.2 View exported file
```bash
cat cap-table.csv
```

**Expected**: CSV format with columns: Address, Balance, Ownership %

### 9.3 Export historical cap table
```bash
curl "http://localhost:3001/api/cap-table/export?blockNumber=BLOCK_NUMBER" -o cap-table-historical.csv
```

## Test Scenario 10: Error Handling

### 10.1 Invalid address format
```bash
curl -X POST http://localhost:3001/api/wallets/approve \
  -H "Content-Type: application/json" \
  -d '{"address": "invalid"}'
```

**Expected**: Status 400, error message about invalid address

### 10.2 Missing required field
```bash
curl -X POST http://localhost:3001/api/tokens/mint \
  -H "Content-Type: application/json" \
  -d '{"to": "WALLET_A"}'
```

**Expected**: Status 400, error about missing amount

### 10.3 Invalid amount
```bash
curl -X POST http://localhost:3001/api/tokens/mint \
  -H "Content-Type: application/json" \
  -d '{"to": "WALLET_A", "amount": "-100"}'
```

**Expected**: Status 400, error about invalid amount

### 10.4 Invalid multiplier
```bash
curl -X POST http://localhost:3001/api/corporate-actions/split \
  -H "Content-Type: application/json" \
  -d '{"multiplier": 1}'
```

**Expected**: Status 400, error about multiplier must be > 1

### 10.5 Non-existent endpoint
```bash
curl http://localhost:3001/api/nonexistent
```

**Expected**: Status 404, endpoint not found

## Test Scenario 11: Relayer Operations

### 11.1 Get relayer address
```bash
curl http://localhost:3001/api/relayer/address
```

**Expected**: Relayer wallet address displayed

## Test Scenario 12: Indexer Verification

### 12.1 Check indexer status
```bash
curl http://localhost:3001/health
```

**Expected**: `indexer: "running"`, `lastIndexedBlock` updates

### 12.2 Perform operation and verify indexing
```bash
# Mint tokens
curl -X POST http://localhost:3001/api/tokens/mint \
  -H "Content-Type: application/json" \
  -d '{"to": "WALLET_A", "amount": "100"}'

# Wait 10 seconds for indexer to catch up
sleep 10

# Check cap table reflects new balance
curl http://localhost:3001/api/cap-table
```

**Expected**: New balance reflected in cap table

## Verification Checklist

After completing all tests:

- [ ] All wallets can be approved/revoked
- [ ] Tokens can be minted to approved wallets
- [ ] Cap table shows correct balances and percentages
- [ ] Stock split multiplies all balances correctly
- [ ] Symbol change updates metadata without affecting balances
- [ ] Historical cap table queries return correct data
- [ ] CSV export works for current and historical data
- [ ] Error handling returns appropriate status codes
- [ ] Indexer processes events in real-time
- [ ] Health check shows all services connected

## Performance Benchmarks

Record these metrics:

1. **Approval transaction time**: _____ seconds
2. **Mint transaction time**: _____ seconds
3. **Stock split transaction time**: _____ seconds
4. **Symbol change transaction time**: _____ seconds
5. **Cap table query time** (current): _____ ms
6. **Cap table query time** (historical): _____ ms
7. **Indexer lag time** (block to database): _____ seconds

## Troubleshooting

### Transactions failing
- Check relayer wallet has MATIC
- Verify contract address is correct
- Check RPC connection

### Indexer not updating
- Restart server
- Check console for errors
- Verify RPC rate limits

### Database errors
- Stop server
- Delete *.db-wal and *.db-shm files
- Restart server

## Next Steps

After all tests pass:
1. Document any issues found
2. Note gas costs for each operation
3. Test with frontend integration
4. Prepare for production deployment
