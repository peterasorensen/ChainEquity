# ChainEquity Gas Report

Gas cost analysis for all smart contract operations on Polygon Amoy testnet.

**Test Environment**:
- Chain: Polygon Amoy Testnet
- Block: TBD
- Gas Price: ~30 gwei (typical)
- Framework: Foundry
- Optimizer: Enabled (200 runs)

---

## Executive Summary

| Operation | Target Gas | Actual Gas | Status | Cost (MATIC) | Cost (USD) |
|-----------|-----------|------------|--------|--------------|------------|
| Deploy contract | N/A | TBD | Pending | TBD | TBD |
| Mint tokens | <100k | TBD | Pending | TBD | TBD |
| Approve wallet | <50k | TBD | Pending | TBD | TBD |
| Revoke wallet | <50k | TBD | Pending | TBD | TBD |
| Transfer (gated) | <100k | TBD | Pending | TBD | TBD |
| Transfer (standard) | ~21k | TBD | Pending | TBD | TBD |
| Stock split | <50k | TBD | Pending | TBD | TBD |
| Symbol change | <50k | TBD | Pending | TBD | TBD |
| Burn tokens | <80k | TBD | Pending | TBD | TBD |

**Note**: Actual gas costs will be populated after contract implementation and testing.

**Calculation**: Cost = Gas Used × Gas Price × MATIC Price
- Gas Price: 30 gwei (0.00000003 MATIC)
- MATIC Price: ~$0.70 (example, fluctuates)

---

## Detailed Gas Analysis

### Contract Deployment

**Operation**: Deploy GatedToken contract

**Expected Gas**: ~1,500,000 - 2,000,000 gas

**Factors Affecting Cost**:
- Constructor initialization (name, symbol, decimals)
- Owner assignment
- Initial state variables
- Contract size (code + metadata)

**Optimization Strategies**:
- Enable Solidity optimizer (200 runs)
- Minimize constructor logic
- Use efficient data types
- Remove unused code

**Actual Measurement**:
```
To be completed after implementation:
- Total gas used: TBD
- Transaction hash: TBD
- Block number: TBD
- Actual cost: TBD MATIC
```

---

### Mint Tokens

**Operation**: `mint(address to, uint256 amount)`

**Target**: <100,000 gas

**Expected Gas**: 50,000 - 70,000 gas

**Gas Breakdown**:
- Transaction base cost: 21,000 gas
- SSTORE (balance update): ~20,000 gas (cold storage)
- SSTORE (total supply update): ~5,000 gas (warm storage)
- Event emission: ~2,000 gas
- Allowlist check: ~2,000 gas
- Arithmetic operations: ~500 gas

**Code Path**:
```solidity
function mint(address to, uint256 amount) public onlyOwner {
    require(isApproved[to], "Recipient not approved"); // 2k gas
    _balances[to] += amount;                           // 20k gas (cold)
    _totalSupply += amount;                            // 5k gas (warm)
    emit Transfer(address(0), to, amount);             // 2k gas
}
```

**Optimization Strategies**:
- Use unchecked math where overflow impossible
- Pack state variables efficiently
- Minimize external calls

**Actual Measurement**:
```
To be completed after testing:
- First mint (cold storage): TBD gas
- Subsequent mints (warm storage): TBD gas
- Average across 10 mints: TBD gas
```

---

### Approve Wallet

**Operation**: `approve(address wallet)`

**Target**: <50,000 gas

**Expected Gas**: 30,000 - 45,000 gas

**Gas Breakdown**:
- Transaction base: 21,000 gas
- SSTORE (set approval): ~20,000 gas (cold)
- Event emission: ~2,000 gas
- Admin check: ~1,000 gas

**Code Path**:
```solidity
function approve(address wallet) public onlyOwner {
    require(!isApproved[wallet], "Already approved"); // 2k gas
    isApproved[wallet] = true;                        // 20k gas
    emit WalletApproved(wallet);                      // 2k gas
}
```

**Optimization Strategies**:
- Use bool instead of uint256 for flags (saves 19k gas)
- Consider bitmap for multiple approvals in one tx

**Actual Measurement**:
```
To be completed after testing:
- First approval: TBD gas
- Average across 10 approvals: TBD gas
```

---

### Revoke Wallet

**Operation**: `revoke(address wallet)`

**Target**: <50,000 gas

**Expected Gas**: 25,000 - 40,000 gas

**Gas Breakdown**:
- Transaction base: 21,000 gas
- SSTORE (clear approval): ~5,000 gas (refund for clearing)
- Event emission: ~2,000 gas
- Admin check: ~1,000 gas

**Code Path**:
```solidity
function revoke(address wallet) public onlyOwner {
    require(isApproved[wallet], "Not approved");      // 2k gas
    isApproved[wallet] = false;                       // 5k gas (refund)
    emit WalletRevoked(wallet);                       // 2k gas
}
```

**Gas Refund**: Setting storage to zero refunds gas (5,000 vs 20,000 for setting)

**Actual Measurement**:
```
To be completed after testing:
- Actual gas used: TBD gas
- Gas refund: TBD gas
- Net cost: TBD gas
```

---

### Transfer (Gated)

**Operation**: `transfer(address to, uint256 amount)`

**Target**: <100,000 gas

**Expected Gas**: 60,000 - 80,000 gas

**Gas Breakdown**:
- Transaction base: 21,000 gas
- Sender allowlist check: ~2,000 gas
- Receiver allowlist check: ~2,000 gas
- Balance update (sender): ~5,000 gas
- Balance update (receiver): ~20,000 gas (if cold)
- Event emission: ~2,000 gas
- Split multiplier application: ~500 gas

**Code Path**:
```solidity
function transfer(address to, uint256 amount) public returns (bool) {
    require(isApproved[msg.sender], "Sender not approved");    // 2k
    require(isApproved[to], "Receiver not approved");          // 2k

    uint256 actualAmount = amount / splitMultiplier;           // 500

    _balances[msg.sender] -= actualAmount;                     // 5k
    _balances[to] += actualAmount;                             // 20k

    emit Transfer(msg.sender, to, amount);                     // 2k
    return true;
}
```

**Comparison to Standard ERC-20**:
- Standard transfer: ~21,000 - 35,000 gas
- Gated transfer: ~60,000 - 80,000 gas
- Overhead: ~40,000 gas (2x allowlist checks)

**Optimization Strategies**:
- Cache allowlist checks if multiple operations
- Use transferFrom for relayer pattern (single allowlist check)

**Actual Measurement**:
```
To be completed after testing:
- First transfer (cold storage): TBD gas
- Subsequent transfers (warm storage): TBD gas
- Comparison to non-gated: TBD gas overhead
```

---

### Stock Split

**Operation**: `executeSplit(uint256 multiplier)`

**Target**: <50,000 gas

**Expected Gas**: 30,000 - 45,000 gas

**Gas Breakdown**:
- Transaction base: 21,000 gas
- SSTORE (update multiplier): ~5,000 gas (warm)
- Event emission: ~2,000 gas
- Admin check: ~1,000 gas
- Arithmetic: ~500 gas

**Code Path**:
```solidity
function executeSplit(uint256 multiplier) public onlyOwner {
    require(multiplier > 0, "Invalid multiplier");             // 500
    uint256 oldMultiplier = splitMultiplier;                   // 200
    splitMultiplier *= multiplier;                             // 5k
    emit StockSplit(oldMultiplier, splitMultiplier);           // 2k
}
```

**Why So Cheap?**:
- **Virtual split**: Doesn't iterate through holders
- **Single storage update**: Only updates multiplier variable
- **O(1) complexity**: Same cost for 10 or 10,000 holders

**Comparison to Alternative Approaches**:
- Iterate all holders: 50k gas × holder count = 500k for 10, 5M for 100
- Our approach: ~35k gas regardless of holder count
- **Savings**: 93-99% gas reduction at scale

**Actual Measurement**:
```
To be completed after testing:
- Gas used: TBD gas
- With 10 holders: TBD gas
- With 100 holders: TBD gas (should be same!)
```

---

### Symbol Change

**Operation**: `changeSymbol(string memory newSymbol)`

**Target**: <50,000 gas

**Expected Gas**: 35,000 - 50,000 gas

**Gas Breakdown**:
- Transaction base: 21,000 gas
- SSTORE (update symbol): ~20,000 gas (depends on length)
- Event emission: ~3,000 gas (includes string data)
- Admin check: ~1,000 gas
- String validation: ~1,000 gas

**Code Path**:
```solidity
function changeSymbol(string memory newSymbol) public onlyOwner {
    require(bytes(newSymbol).length > 0, "Empty");             // 500
    require(bytes(newSymbol).length <= 10, "Too long");        // 500

    string memory oldSymbol = symbol;                          // 2k
    symbol = newSymbol;                                        // 20k

    emit SymbolChanged(oldSymbol, newSymbol);                  // 3k
}
```

**Gas Variation by Symbol Length**:
- 1-3 characters: ~35k gas
- 4-6 characters: ~40k gas
- 7-10 characters: ~45k gas

**Optimization Strategies**:
- Limit symbol to 10 characters max
- Use bytes instead of string (slight savings)
- Consider fixed-size bytes10 for maximum efficiency

**Actual Measurement**:
```
To be completed after testing:
- Short symbol (3 chars): TBD gas
- Medium symbol (6 chars): TBD gas
- Long symbol (10 chars): TBD gas
```

---

### Burn Tokens

**Operation**: `burn(address from, uint256 amount)`

**Target**: <80,000 gas

**Expected Gas**: 40,000 - 60,000 gas

**Gas Breakdown**:
- Transaction base: 21,000 gas
- Balance check: ~2,000 gas
- Balance update: ~5,000 gas (refund for reducing)
- Total supply update: ~5,000 gas
- Event emission: ~2,000 gas
- Admin check: ~1,000 gas

**Code Path**:
```solidity
function burn(address from, uint256 amount) public onlyOwner {
    require(_balances[from] >= amount, "Insufficient balance"); // 2k

    _balances[from] -= amount;                                  // 5k
    _totalSupply -= amount;                                     // 5k

    emit Transfer(from, address(0), amount);                    // 2k
}
```

**Gas Refund**: Reducing balances provides gas refund

**Actual Measurement**:
```
To be completed after testing:
- Actual gas used: TBD gas
- Gas refund: TBD gas
- Net cost: TBD gas
```

---

## Optimization Techniques Applied

### 1. Storage Packing

**Before**:
```solidity
address public owner;        // 20 bytes
bool public paused;          // 1 byte
uint256 public splitMultiplier;  // 32 bytes
```
**After**:
```solidity
address public owner;        // Slot 1: 20 bytes
bool public paused;          // Slot 1: 1 byte (packed!)
uint256 public splitMultiplier;  // Slot 2: 32 bytes
```
**Savings**: One SSTORE operation (~20k gas) when both updated

---

### 2. Unchecked Math

**Before**:
```solidity
function mint(address to, uint256 amount) public {
    _balances[to] += amount;  // Overflow check: ~200 gas
}
```
**After**:
```solidity
function mint(address to, uint256 amount) public {
    unchecked {
        _balances[to] += amount;  // No check: ~50 gas
    }
}
```
**Savings**: ~150 gas per operation
**Safety**: Only when overflow impossible (e.g., capped supply)

---

### 3. Short-Circuit Checks

**Before**:
```solidity
require(isApproved[sender] && isApproved[receiver], "Not approved");
```
**After**:
```solidity
require(isApproved[sender], "Sender not approved");
require(isApproved[receiver], "Receiver not approved");
```
**Savings**: Fails fast, better error messages, similar gas

---

### 4. Event Optimization

**Before**:
```solidity
event Transfer(address indexed from, address indexed to, uint256 amount, string memo);
```
**After**:
```solidity
event Transfer(address indexed from, address indexed to, uint256 amount);
```
**Savings**: ~1k gas per event (avoid string in events)

---

### 5. Virtual Split (Biggest Win)

**Traditional Approach**:
```solidity
// Iterate all holders: O(n) gas
for (uint i = 0; i < holders.length; i++) {
    _balances[holders[i]] *= 7;  // 50k gas × n
}
```

**Our Approach**:
```solidity
// Update multiplier: O(1) gas
splitMultiplier *= 7;  // 5k gas total
```

**Savings**: 99% reduction at 100+ holders

---

## Gas Cost Comparison (Projected)

### Per-Transaction Costs (MATIC)

Assuming:
- Gas price: 30 gwei
- MATIC price: $0.70

| Operation | Gas | MATIC | USD |
|-----------|-----|-------|-----|
| Deploy | 1,800,000 | 0.054 | $0.038 |
| Mint | 60,000 | 0.0018 | $0.0013 |
| Approve | 40,000 | 0.0012 | $0.0008 |
| Transfer | 70,000 | 0.0021 | $0.0015 |
| Split | 35,000 | 0.00105 | $0.0007 |
| Symbol change | 40,000 | 0.0012 | $0.0008 |

**Total for Complete Demo Flow**:
- Deploy + 10 approvals + 10 mints + 5 transfers + 1 split + 1 symbol change
- Total: ~2,600,000 gas
- Cost: ~0.078 MATIC (~$0.055 USD)

---

### Comparison to Ethereum Mainnet

Same operations on Ethereum (at 15 gwei, $3,000 ETH):

| Operation | Polygon Amoy | Ethereum | Savings |
|-----------|--------------|----------|---------|
| Deploy | $0.038 | $81.00 | 99.95% |
| Mint | $0.0013 | $2.70 | 99.95% |
| Transfer | $0.0015 | $3.15 | 99.95% |
| Split | $0.0007 | $1.58 | 99.96% |

**Complete demo flow**:
- Polygon: $0.055
- Ethereum: $117.00
- **Savings: 99.95%**

---

## Scalability Analysis

### Stock Split at Different Holder Counts

Traditional iteration approach:

| Holders | Gas Cost | MATIC | USD | Block Limit |
|---------|----------|-------|-----|-------------|
| 10 | 500,000 | 0.015 | $0.011 | OK |
| 100 | 5,000,000 | 0.15 | $0.105 | OK |
| 1,000 | 50,000,000 | 1.5 | $1.05 | EXCEEDS |
| 10,000 | 500,000,000 | 15.0 | $10.50 | IMPOSSIBLE |

**Our virtual split approach**:

| Holders | Gas Cost | MATIC | USD | Block Limit |
|---------|----------|-------|-----|-------------|
| 10 | 35,000 | 0.00105 | $0.0007 | OK |
| 100 | 35,000 | 0.00105 | $0.0007 | OK |
| 1,000 | 35,000 | 0.00105 | $0.0007 | OK |
| 10,000 | 35,000 | 0.00105 | $0.0007 | OK |

**Result**: O(1) complexity enables unlimited scalability

---

## Foundry Gas Report Command

To generate actual gas report after implementation:

```bash
# Run tests with gas reporting
forge test --gas-report

# Generate detailed report
forge test --gas-report > gas_report.txt

# Test specific function
forge test --match-test testMint --gas-report

# Run with profiler
forge test --gas-report --fuzz-runs 1000
```

**Output Format**:
```
╭──────────────────────────┬─────────────────┬────────┬────────┬────────┬─────────╮
│ GatedToken contract      ┆                 ┆        ┆        ┆        ┆         │
╞══════════════════════════╪═════════════════╪════════╪════════╪════════╪═════════╡
│ Deployment Cost          ┆ Deployment Size ┆        ┆        ┆        ┆         │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ 1234567                  ┆ 5678            ┆        ┆        ┆        ┆         │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ Function Name            ┆ min             ┆ avg    ┆ median ┆ max    ┆ # calls │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ mint                     ┆ 45000           ┆ 60000  ┆ 58000  ┆ 75000  ┆ 10      │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌┤
│ transfer                 ┆ 55000           ┆ 70000  ┆ 68000  ┆ 85000  ┆ 20      │
╰──────────────────────────┴─────────────────┴────────┴────────┴────────┴─────────╯
```

---

## Optimization Opportunities

### Future Improvements

1. **Batch Operations**: Approve/mint multiple addresses in one transaction
   - Current: 40k gas × 10 = 400k gas
   - Batched: ~150k gas for 10 (62% savings)

2. **EIP-2612 Permits**: Gasless approvals via signatures
   - Eliminates separate approval transactions
   - Users sign off-chain, relayer submits

3. **Assembly Optimization**: Critical paths in inline assembly
   - Potential 10-20% gas reduction
   - Increased complexity and risk

4. **Storage Proofs**: Verify balances off-chain, submit proof
   - Reduces on-chain storage reads
   - Complex implementation

5. **Calldata Compression**: Compress function inputs
   - Saves on calldata gas (16 gas per non-zero byte)
   - Marginal savings on L2

**Target**: 50% gas reduction from current baseline

---

## Testing Methodology

### Gas Profiling Strategy

1. **Unit Tests**: Measure individual function gas costs
2. **Integration Tests**: Measure complete workflow costs
3. **Fuzz Tests**: Identify worst-case scenarios
4. **Comparison Tests**: Compare to standard ERC-20
5. **Scalability Tests**: Test with varying holder counts

### Test Cases

```solidity
// Test gas cost for minting
function testGas_Mint() public {
    uint256 gasBefore = gasleft();
    token.mint(alice, 1000);
    uint256 gasUsed = gasBefore - gasleft();

    assertLt(gasUsed, 100_000, "Mint exceeds target");
}

// Test split scalability
function testGas_SplitWithManyHolders() public {
    // Add 100 holders
    for (uint i = 0; i < 100; i++) {
        address holder = address(uint160(i + 1));
        token.approve(holder);
        token.mint(holder, 100);
    }

    uint256 gasBefore = gasleft();
    token.executeSplit(7);
    uint256 gasUsed = gasBefore - gasleft();

    assertLt(gasUsed, 50_000, "Split exceeds target");
}
```

---

## Actual Results

**Status**: To be completed after implementation

When tests are complete, update this section with:
- Actual gas measurements from Foundry
- Transaction hashes from testnet
- Screenshots of gas profiler
- Comparison charts
- Analysis of any deviations from targets

**Format**:
```
Operation: mint
Target: <100k gas
Actual: 64,523 gas
Status: ✓ PASS (35% under target)
Min: 45,234 | Avg: 64,523 | Max: 82,109
Optimizations applied: unchecked math, storage packing
```

---

## Conclusion

**Expected Outcome**: All operations should meet gas targets due to:
1. Virtual split approach (O(1) vs O(n))
2. Storage optimization and packing
3. Solidity optimizer enabled
4. Efficient data structures
5. Minimal external calls

**Key Achievement**: Stock split scalability through stored multiplier pattern

**Production Readiness**: Gas costs suitable for mainnet deployment once other requirements met (audit, compliance, etc.)

---

**Last Updated**: 2025-11-04
**Status**: Awaiting implementation and testing
**To Generate Report**: Run `forge test --gas-report` after implementation
