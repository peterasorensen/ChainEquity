# ChainEquity Backend API Reference

Complete API documentation for the ChainEquity backend service.

Base URL: `http://localhost:3001`

## Response Format

All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Authentication

Currently, no authentication is required. In production, implement:
- API keys
- JWT tokens
- OAuth 2.0
- Rate limiting

---

## System Endpoints

### GET /

Get API overview and available endpoints.

**Response**
```json
{
  "name": "ChainEquity Backend API",
  "version": "1.0.0",
  "description": "...",
  "endpoints": { ... }
}
```

### GET /health

Health check and system status.

**Response**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-04T12:00:00.000Z",
  "services": {
    "database": "connected",
    "blockchain": "connected",
    "indexer": "running",
    "lastIndexedBlock": 12345
  }
}
```

---

## Wallet Management

### POST /api/wallets/approve

Add a wallet address to the allowlist, enabling it to send and receive tokens.

**Request Body**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x...",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "message": "Wallet approved successfully"
  }
}
```

**Errors**
- `400` - Invalid address format
- `500` - Transaction failed

### POST /api/wallets/revoke

Remove a wallet address from the allowlist, preventing it from sending or receiving tokens.

**Request Body**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x...",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "message": "Wallet approval revoked successfully"
  }
}
```

**Errors**
- `400` - Invalid address format
- `500` - Transaction failed

---

## Token Operations

### POST /api/tokens/mint

Mint new tokens to a specified address. The recipient must be on the allowlist.

**Request Body**
```json
{
  "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  "amount": "1000"
}
```

**Parameters**
- `to` (string, required): Recipient address
- `amount` (string, required): Token amount (in ether units, e.g., "1000" = 1000 tokens)

**Response**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x...",
    "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "amount": "1000",
    "message": "Tokens minted successfully"
  }
}
```

**Errors**
- `400` - Invalid address or amount
- `500` - Transaction failed (recipient may not be allowlisted)

### GET /api/tokens/info

Get token metadata information.

**Response**
```json
{
  "success": true,
  "data": {
    "name": "ChainEquity Token",
    "symbol": "CEQT",
    "totalSupply": "10500"
  }
}
```

---

## Corporate Actions

### POST /api/corporate-actions/split

Execute a stock split, multiplying all token balances by the specified multiplier.

**Request Body**
```json
{
  "multiplier": 7
}
```

**Parameters**
- `multiplier` (number, required): Split ratio (must be integer > 1). For 7-for-1 split, use 7.

**Response**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x...",
    "multiplier": 7,
    "message": "Stock split (7-for-1) executed successfully"
  }
}
```

**Errors**
- `400` - Invalid multiplier (must be integer > 1)
- `500` - Transaction failed

**Notes**
- All holder balances are multiplied by the multiplier
- Total supply increases proportionally
- Ownership percentages remain unchanged
- Indexer automatically updates database balances

### POST /api/corporate-actions/rename

Change the token name and symbol.

**Request Body**
```json
{
  "newName": "ChainEquity Token",
  "newSymbol": "CEQT"
}
```

**Parameters**
- `newName` (string, required): New token name
- `newSymbol` (string, required): New token symbol (1-11 characters)

**Response**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x...",
    "newName": "ChainEquity Token",
    "newSymbol": "CEQT",
    "message": "Token name and symbol changed successfully"
  }
}
```

**Errors**
- `400` - Invalid name or symbol
- `500` - Transaction failed

**Notes**
- Balances and supply remain unchanged
- Only metadata is updated

---

## Cap Table

### GET /api/cap-table

Get the current or historical cap table showing all token holders.

**Query Parameters**
- `blockNumber` (number, optional): Block number for historical query

**Examples**
```bash
# Current cap table
GET /api/cap-table

# Historical cap table at block 12345
GET /api/cap-table?blockNumber=12345
```

**Response**
```json
{
  "success": true,
  "data": {
    "blockNumber": 12345,
    "totalShares": "10500",
    "holders": 2,
    "entries": [
      {
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "balance": "7000",
        "percentage": 66.67
      },
      {
        "address": "0x123...",
        "balance": "3500",
        "percentage": 33.33
      }
    ]
  }
}
```

**Response Fields**
- `blockNumber`: Block at which cap table was calculated (null for current)
- `totalShares`: Total token supply
- `holders`: Number of addresses with non-zero balance
- `entries`: Array of holder entries, sorted by balance (descending)
  - `address`: Holder address
  - `balance`: Token balance (as string to handle large numbers)
  - `percentage`: Ownership percentage (0-100)

**Errors**
- `400` - Invalid block number
- `500` - Query failed

**Notes**
- Historical queries reconstruct balances by replaying transactions
- Only holders with non-zero balance are included
- Percentages may not sum to exactly 100.00 due to rounding

### GET /api/cap-table/export

Export cap table as CSV file.

**Query Parameters**
- `blockNumber` (number, optional): Block number for historical export

**Examples**
```bash
# Export current cap table
GET /api/cap-table/export

# Export historical cap table
GET /api/cap-table/export?blockNumber=12345
```

**Response**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="cap-table-current.csv"

Address,Balance,Ownership %
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0,7000,66.67
0x123...,3500,33.33
```

**Errors**
- `400` - Invalid block number
- `500` - Export failed

---

## Allowlist

### GET /api/allowlist/:address

Check if a specific address is on the allowlist.

**Path Parameters**
- `address` (string, required): Ethereum address to check

**Example**
```bash
GET /api/allowlist/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0
```

**Response**
```json
{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "approved": true,
    "lastUpdated": 1699123456789,
    "source": {
      "blockchain": true,
      "database": true
    }
  }
}
```

**Response Fields**
- `address`: The queried address
- `approved`: Current allowlist status
- `lastUpdated`: Timestamp of last status change (Unix milliseconds)
- `source`: Verification from both blockchain and database
  - `blockchain`: Status from on-chain contract
  - `database`: Status from indexed database

**Errors**
- `400` - Invalid address format
- `500` - Query failed

### GET /api/allowlist

Get all addresses currently on the allowlist.

**Response**
```json
{
  "success": true,
  "data": {
    "count": 2,
    "addresses": [
      {
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "approved": true,
        "timestamp": 1699123456789
      },
      {
        "address": "0x123...",
        "approved": true,
        "timestamp": 1699123456790
      }
    ]
  }
}
```

**Response Fields**
- `count`: Number of allowlisted addresses
- `addresses`: Array of allowlist entries
  - `address`: Ethereum address
  - `approved`: Always true for this endpoint
  - `timestamp`: When address was approved

---

## Relayer

### POST /api/relayer/submit

Submit a pre-signed transaction for execution.

**Request Body**
```json
{
  "signedTransaction": "0x..."
}
```

**Parameters**
- `signedTransaction` (string, required): Hex-encoded signed transaction

**Response**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x...",
    "message": "Transaction submitted successfully"
  }
}
```

**Errors**
- `400` - Invalid transaction format
- `500` - Submission failed

**Notes**
- Used for submitting user-signed transactions
- Transaction must be properly formatted and signed
- Relayer broadcasts transaction to network

### GET /api/relayer/address

Get the relayer wallet address.

**Response**
```json
{
  "success": true,
  "data": {
    "relayerAddress": "0x...",
    "message": "This address is used to sign and submit transactions on behalf of users"
  }
}
```

**Notes**
- This address needs MATIC for gas fees
- All contract operations are signed by this address
- Fund this address to enable operations

---

## Rate Limits

Currently no rate limits are enforced. For production:

- **Standard endpoints**: 100 requests/minute per IP
- **Transaction endpoints**: 10 requests/minute per IP
- **Export endpoints**: 5 requests/minute per IP

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 404 | Not Found (endpoint doesn't exist) |
| 500 | Internal Server Error (transaction failed, database error) |

---

## WebSocket Support

Not currently implemented. Future versions may include:
- Real-time event notifications
- Transaction status updates
- Balance change notifications

---

## SDK Examples

### JavaScript/Node.js

```javascript
const API_URL = 'http://localhost:3001';

// Approve wallet
async function approveWallet(address) {
  const response = await fetch(`${API_URL}/api/wallets/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });
  return await response.json();
}

// Mint tokens
async function mintTokens(to, amount) {
  const response = await fetch(`${API_URL}/api/tokens/mint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, amount })
  });
  return await response.json();
}

// Get cap table
async function getCapTable(blockNumber = null) {
  const url = blockNumber
    ? `${API_URL}/api/cap-table?blockNumber=${blockNumber}`
    : `${API_URL}/api/cap-table`;
  const response = await fetch(url);
  return await response.json();
}
```

### Python

```python
import requests

API_URL = 'http://localhost:3001'

# Approve wallet
def approve_wallet(address):
    response = requests.post(
        f'{API_URL}/api/wallets/approve',
        json={'address': address}
    )
    return response.json()

# Mint tokens
def mint_tokens(to, amount):
    response = requests.post(
        f'{API_URL}/api/tokens/mint',
        json={'to': to, 'amount': amount}
    )
    return response.json()

# Get cap table
def get_cap_table(block_number=None):
    url = f'{API_URL}/api/cap-table'
    if block_number:
        url += f'?blockNumber={block_number}'
    response = requests.get(url)
    return response.json()
```

### cURL

```bash
# Approve wallet
curl -X POST http://localhost:3001/api/wallets/approve \
  -H "Content-Type: application/json" \
  -d '{"address": "0x..."}'

# Mint tokens
curl -X POST http://localhost:3001/api/tokens/mint \
  -H "Content-Type: application/json" \
  -d '{"to": "0x...", "amount": "1000"}'

# Get cap table
curl http://localhost:3001/api/cap-table

# Export cap table
curl http://localhost:3001/api/cap-table/export -o cap-table.csv
```

---

## Changelog

### v1.0.0 (2024-11-04)
- Initial release
- All core endpoints implemented
- Event indexer with real-time monitoring
- Historical cap table queries
- CSV export functionality

---

## Support

For issues or feature requests:
1. Check health endpoint: `GET /health`
2. Review server logs
3. Verify environment variables
4. Check blockchain connection

For production deployment guidance, see README.md
