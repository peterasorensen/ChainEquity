# GatedEquityToken Smart Contract

A gated ERC20 token representing company equity with allowlist-based transfer restrictions and corporate action capabilities.

## Features

- **Allowlist Gating:** Only approved addresses can send or receive tokens
- **Stock Splits:** Efficient O(1) gas multiplier-based implementation
- **Symbol Changes:** Update token ticker without redeployment
- **Access Control:** Admin-only functions using OpenZeppelin Ownable
- **Events:** Complete event coverage for all state changes
- **Gas Optimized:** All operations well under reasonable gas limits

## Quick Start

### Install Dependencies
```bash
forge install
```

### Build
```bash
forge build
```

### Test
```bash
# Run all tests
forge test

# Run with verbosity
forge test -vv

# Generate gas report
forge test --gas-report
```

### Deploy
```bash
# Local deployment (Anvil)
anvil  # In separate terminal
forge script script/Deploy.s.sol:Deploy --rpc-url http://localhost:8545 --broadcast

# Testnet deployment (Polygon Amoy)
forge script script/Deploy.s.sol:Deploy --rpc-url $POLYGON_AMOY_RPC_URL --broadcast --verify
```

## Contract Interface

### Admin Functions

```solidity
// Allowlist management
function addToAllowlist(address account) external onlyOwner
function removeFromAllowlist(address account) external onlyOwner

// Token minting
function mint(address to, uint256 amount) external onlyOwner

// Corporate actions
function stockSplit(uint256 numerator, uint256 denominator) external onlyOwner
function changeSymbol(string memory newSymbol) external onlyOwner
```

### Public Functions

```solidity
// Standard ERC20
function transfer(address to, uint256 value) public returns (bool)
function transferFrom(address from, address to, uint256 value) public returns (bool)
function balanceOf(address account) public view returns (uint256)
function totalSupply() public view returns (uint256)
function approve(address spender, uint256 value) public returns (bool)
function allowance(address owner, address spender) public view returns (uint256)

// Token metadata
function name() public view returns (string memory)
function symbol() public view returns (string memory)
function decimals() public view returns (uint8)

// Allowlist status
function allowlist(address account) public view returns (bool)
function splitMultiplier() public view returns (uint256)
```

### Events

```solidity
event AllowlistUpdated(address indexed account, bool status)
event StockSplit(uint256 oldMultiplier, uint256 newMultiplier)
event SymbolChanged(string oldSymbol, string newSymbol)
event Transfer(address indexed from, address indexed to, uint256 value)
event Approval(address indexed owner, address indexed spender, uint256 value)
```

## Usage Examples

### Approve and Mint Tokens
```javascript
// Approve wallet
await token.addToAllowlist(userAddress);

// Mint 1000 tokens
await token.mint(userAddress, ethers.parseEther("1000"));
```

### Transfer Between Approved Wallets
```javascript
// Ensure both addresses are on allowlist
await token.addToAllowlist(user1);
await token.addToAllowlist(user2);

// Transfer 500 tokens from user1 to user2
await token.connect(user1).transfer(user2, ethers.parseEther("500"));
```

### Execute 7-for-1 Stock Split
```javascript
// Before: User has 1000 tokens
// Execute split
await token.stockSplit(7, 1);
// After: User has 7000 tokens
```

### Change Token Symbol
```javascript
// Change from "ACME" to "ACMEX"
await token.changeSymbol("ACMEX");
// Balances remain unchanged, only metadata updates
```

### Revoke Approval
```javascript
// Remove address from allowlist
await token.removeFromAllowlist(userAddress);
// User can no longer send or receive tokens
```

## Testing

### Test Suite Coverage

The test suite includes 30 comprehensive tests covering:

- Initialization and state
- Allowlist management (add, remove, validation)
- Minting (approved/non-approved scenarios)
- Transfers (success and failure cases)
- TransferFrom with approvals
- Stock splits (7-for-1, reverse splits, multiple splits)
- Symbol changes
- Authorization checks
- Edge cases (zero balances, large amounts)
- Complete end-to-end workflows

### Run Specific Tests
```bash
# Run specific test
forge test --match-test testStockSplit7For1

# Run tests matching pattern
forge test --match-path test/GatedEquityToken.t.sol

# Run with gas report
forge test --gas-report
```

## Gas Costs

| Operation | Average Gas | Status |
|-----------|-------------|--------|
| Deployment | 1,098,380 | - |
| Add to Allowlist | 46,175 | <50k target |
| Mint Tokens | 65,385 | <100k target |
| Transfer (Gated) | 39,302 | <100k target |
| Stock Split | 28,976 | O(1) efficient |
| Change Symbol | 31,097 | <50k target |

All operations meet PRD gas targets.

## Security

- Uses OpenZeppelin v5.5.0 audited contracts
- Access control via Ownable pattern
- Input validation on all admin functions
- Zero address protection
- Comprehensive event logging
- No unchecked math (Solidity 0.8.24)

## Implementation Details

### Stock Split Mechanism

Uses a stored multiplier approach for gas efficiency:

```solidity
uint256 public splitMultiplier = 1e18; // Starts at 1x

function stockSplit(uint256 numerator, uint256 denominator) external onlyOwner {
    uint256 oldMultiplier = splitMultiplier;
    splitMultiplier = (splitMultiplier * numerator) / denominator;
    emit StockSplit(oldMultiplier, splitMultiplier);
}

function balanceOf(address account) public view returns (uint256) {
    uint256 baseBalance = super.balanceOf(account);
    return (baseBalance * splitMultiplier) / 1e18;
}
```

**Benefits:**
- O(1) gas cost regardless of holder count
- No iteration required
- Supports multiple sequential splits
- Instant execution

**Trade-off:**
- Internal balances differ from displayed balances
- Transfer amounts converted automatically

### Mutable Metadata

Name and symbol stored as state variables:

```solidity
string private _tokenName;
string private _tokenSymbol;

function changeSymbol(string memory newSymbol) external onlyOwner {
    string memory oldSymbol = _tokenSymbol;
    _tokenSymbol = newSymbol;
    emit SymbolChanged(oldSymbol, newSymbol);
}
```

Allows ticker changes without redeployment while preserving all balances.

## Development

### Project Structure
```
contracts/
├── src/
│   └── GatedEquityToken.sol      # Main contract
├── test/
│   └── GatedEquityToken.t.sol    # Test suite
├── script/
│   └── Deploy.s.sol              # Deployment script
├── foundry.toml                  # Foundry config
└── gas-report.txt                # Gas benchmark results
```

### Environment Variables

Create a `.env` file:
```bash
PRIVATE_KEY=your_private_key_here
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### Foundry Configuration

See `foundry.toml` for:
- Solidity version (0.8.24)
- Optimizer settings (200 runs)
- RPC endpoints
- Etherscan verification

## License

MIT

## Disclaimer

This is a technical prototype for demonstration purposes. NOT regulatory-compliant. Do not use for real securities without legal review.
