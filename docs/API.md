# ChainEquity API Documentation

Complete REST API reference for the ChainEquity backend service.

**Base URL**: `http://localhost:3001` (development)

**Content-Type**: `application/json`

**Authentication**: Currently no authentication (prototype only). Production would require API keys or OAuth.

---

## Table of Contents

1. [Admin Operations](#admin-operations)
2. [Cap Table](#cap-table)
3. [Corporate Actions](#corporate-actions)
4. [Allowlist Management](#allowlist-management)
5. [Token Information](#token-information)
6. [Relayer Service](#relayer-service)
7. [Error Responses](#error-responses)

---

## Admin Operations

### Approve Wallet

Add a wallet address to the allowlist, enabling it to send and receive tokens.

**Endpoint**: `POST /api/admin/approve`

**Request Body**:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response**:
```json
{
  "success": true,
  "transactionHash": "0xabc123...",
  "message": "Wallet approved successfully"
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/admin/approve \
  -H "Content-Type: application/json" \
  -d '{"address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

**Errors**:
- `400`: Invalid address format
- `409`: Address already approved
- `500`: Transaction failed

---

### Revoke Wallet

Remove a wallet address from the allowlist, preventing future transfers.

**Endpoint**: `POST /api/admin/revoke`

**Request Body**:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response**:
```json
{
  "success": true,
  "transactionHash": "0xdef456...",
  "message": "Wallet revoked successfully"
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/admin/revoke \
  -H "Content-Type: application/json" \
  -d '{"address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

**Errors**:
- `400`: Invalid address format
- `404`: Address not on allowlist
- `500`: Transaction failed

---

### Mint Tokens

Mint new tokens to an approved wallet address.

**Endpoint**: `POST /api/admin/mint`

**Request Body**:
```json
{
  "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "amount": "1000"
}
```

**Parameters**:
- `to` (string, required): Recipient wallet address
- `amount` (string, required): Token amount (in base units, no decimals)

**Response**:
```json
{
  "success": true,
  "transactionHash": "0xghi789...",
  "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "amount": "1000",
  "message": "Tokens minted successfully"
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/admin/mint \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "1000"
  }'
```

**Errors**:
- `400`: Invalid address or amount
- `403`: Recipient not on allowlist
- `500`: Transaction failed

---

### Burn Tokens

Burn tokens from an address, reducing total supply.

**Endpoint**: `POST /api/admin/burn`

**Request Body**:
```json
{
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "amount": "500"
}
```

**Parameters**:
- `from` (string, required): Address to burn tokens from
- `amount` (string, required): Token amount to burn

**Response**:
```json
{
  "success": true,
  "transactionHash": "0xjkl012...",
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "amount": "500",
  "message": "Tokens burned successfully"
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/admin/burn \
  -H "Content-Type: application/json" \
  -d '{
    "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "500"
  }'
```

**Errors**:
- `400`: Invalid address or amount
- `403`: Insufficient balance
- `500`: Transaction failed

---

## Cap Table

### Get Current Cap Table

Retrieve the current ownership distribution.

**Endpoint**: `GET /api/cap-table`

**Query Parameters**:
- `blockNumber` (optional): Get cap table at specific block height
- `format` (optional): `json` (default) or `csv`

**Response**:
```json
{
  "blockNumber": 12345678,
  "timestamp": "2025-11-04T12:00:00Z",
  "totalSupply": "10000",
  "splitMultiplier": 7,
  "holders": [
    {
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "balance": "3500",
      "displayBalance": "24500",
      "ownershipPercent": 35.0
    },
    {
      "address": "0xAbC123...",
      "balance": "5000",
      "displayBalance": "35000",
      "ownershipPercent": 50.0
    },
    {
      "address": "0xDeF456...",
      "balance": "1500",
      "displayBalance": "10500",
      "ownershipPercent": 15.0
    }
  ]
}
```

**Example (JSON)**:
```bash
curl http://localhost:3001/api/cap-table
```

**Example (CSV)**:
```bash
curl "http://localhost:3001/api/cap-table?format=csv" > cap_table.csv
```

**Example (Historical)**:
```bash
curl "http://localhost:3001/api/cap-table?blockNumber=12340000"
```

**CSV Format**:
```csv
Address,Balance,Display Balance,Ownership %
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,3500,24500,35.0
0xAbC123...,5000,35000,50.0
0xDeF456...,1500,10500,15.0
```

**Errors**:
- `404`: No data for specified block number
- `500`: Database query failed

---

### Get Holder Details

Get detailed information about a specific token holder.

**Endpoint**: `GET /api/cap-table/:address`

**Path Parameters**:
- `address` (string, required): Wallet address to query

**Response**:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "balance": "3500",
  "displayBalance": "24500",
  "ownershipPercent": 35.0,
  "isApproved": true,
  "transactions": [
    {
      "type": "mint",
      "amount": "1000",
      "blockNumber": 12345000,
      "timestamp": "2025-11-01T10:00:00Z",
      "transactionHash": "0xabc..."
    },
    {
      "type": "transfer",
      "from": "0xOther...",
      "to": "0x742d35...",
      "amount": "2500",
      "blockNumber": 12345100,
      "timestamp": "2025-11-02T14:30:00Z",
      "transactionHash": "0xdef..."
    }
  ]
}
```

**Example**:
```bash
curl http://localhost:3001/api/cap-table/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Errors**:
- `400`: Invalid address format
- `404`: Address not found
- `500`: Database query failed

---

## Corporate Actions

### Execute Stock Split

Execute a stock split by multiplying all balances by a multiplier.

**Endpoint**: `POST /api/corporate/split`

**Request Body**:
```json
{
  "multiplier": 7
}
```

**Parameters**:
- `multiplier` (number, required): Split ratio (e.g., 7 for 7-for-1 split)

**Response**:
```json
{
  "success": true,
  "transactionHash": "0xmno345...",
  "multiplier": 7,
  "previousMultiplier": 1,
  "newMultiplier": 7,
  "totalSupplyBefore": "10000",
  "totalSupplyAfter": "70000",
  "message": "Stock split executed successfully"
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/corporate/split \
  -H "Content-Type: application/json" \
  -d '{"multiplier": 7}'
```

**Errors**:
- `400`: Invalid multiplier (must be > 0)
- `500`: Transaction failed

---

### Change Symbol

Update the token symbol/ticker.

**Endpoint**: `POST /api/corporate/change-symbol`

**Request Body**:
```json
{
  "newSymbol": "ACMEX"
}
```

**Parameters**:
- `newSymbol` (string, required): New token symbol (1-10 characters)

**Response**:
```json
{
  "success": true,
  "transactionHash": "0xpqr678...",
  "oldSymbol": "ACME",
  "newSymbol": "ACMEX",
  "message": "Symbol changed successfully"
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/corporate/change-symbol \
  -H "Content-Type: application/json" \
  -d '{"newSymbol": "ACMEX"}'
```

**Errors**:
- `400`: Invalid symbol (empty or too long)
- `500`: Transaction failed

---

## Allowlist Management

### Check Allowlist Status

Check if an address is on the allowlist.

**Endpoint**: `GET /api/allowlist/:address`

**Path Parameters**:
- `address` (string, required): Wallet address to check

**Response**:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "isApproved": true,
  "approvedAt": "2025-11-01T09:00:00Z",
  "approvedBy": "admin"
}
```

**Example**:
```bash
curl http://localhost:3001/api/allowlist/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Errors**:
- `400`: Invalid address format
- `500`: Query failed

---

### Get All Approved Wallets

List all wallets currently on the allowlist.

**Endpoint**: `GET /api/allowlist`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 200)

**Response**:
```json
{
  "total": 150,
  "page": 1,
  "limit": 50,
  "addresses": [
    {
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "approvedAt": "2025-11-01T09:00:00Z",
      "balance": "3500"
    },
    {
      "address": "0xAbC123...",
      "approvedAt": "2025-11-01T10:30:00Z",
      "balance": "5000"
    }
  ]
}
```

**Example**:
```bash
curl "http://localhost:3001/api/allowlist?page=1&limit=50"
```

**Errors**:
- `500`: Database query failed

---

## Token Information

### Get Token Metadata

Retrieve basic token information.

**Endpoint**: `GET /api/token/info`

**Response**:
```json
{
  "name": "ChainEquity Token",
  "symbol": "ACME",
  "decimals": 18,
  "totalSupply": "10000",
  "displayTotalSupply": "70000",
  "splitMultiplier": 7,
  "contractAddress": "0xContractAddress...",
  "owner": "0xOwnerAddress...",
  "chainId": 80002,
  "chainName": "Polygon Amoy Testnet"
}
```

**Example**:
```bash
curl http://localhost:3001/api/token/info
```

**Errors**:
- `500`: Contract query failed

---

### Get Token Events

Retrieve recent token events (transfers, mints, burns, etc.).

**Endpoint**: `GET /api/token/events`

**Query Parameters**:
- `type` (optional): Filter by event type (`transfer`, `mint`, `burn`, `approval`, `revocation`, `split`, `symbolChange`)
- `address` (optional): Filter by address (sender or receiver)
- `fromBlock` (optional): Start block number
- `toBlock` (optional): End block number
- `limit` (optional): Max events to return (default: 100, max: 1000)

**Response**:
```json
{
  "total": 523,
  "events": [
    {
      "type": "transfer",
      "from": "0xSender...",
      "to": "0xReceiver...",
      "amount": "1000",
      "blockNumber": 12345678,
      "transactionHash": "0xstu901...",
      "timestamp": "2025-11-04T12:00:00Z"
    },
    {
      "type": "mint",
      "to": "0xReceiver...",
      "amount": "5000",
      "blockNumber": 12345000,
      "transactionHash": "0xvwx234...",
      "timestamp": "2025-11-01T10:00:00Z"
    },
    {
      "type": "split",
      "multiplier": 7,
      "blockNumber": 12346000,
      "transactionHash": "0xyza567...",
      "timestamp": "2025-11-03T15:00:00Z"
    }
  ]
}
```

**Example**:
```bash
# All events
curl http://localhost:3001/api/token/events

# Only transfers
curl "http://localhost:3001/api/token/events?type=transfer"

# Events involving specific address
curl "http://localhost:3001/api/token/events?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

# Events in block range
curl "http://localhost:3001/api/token/events?fromBlock=12345000&toBlock=12346000"
```

**Errors**:
- `400`: Invalid parameters
- `500`: Database query failed

---

## Relayer Service

### Submit Gasless Transfer

Submit a transfer transaction through the relayer (gasless for user).

**Endpoint**: `POST /api/relayer/transfer`

**Request Body**:
```json
{
  "from": "0xSenderAddress...",
  "to": "0xReceiverAddress...",
  "amount": "1000",
  "signature": "0xSignatureBytes..."
}
```

**Parameters**:
- `from` (string, required): Sender address
- `to` (string, required): Receiver address
- `amount` (string, required): Amount to transfer
- `signature` (string, required): EIP-712 signature from sender

**Response**:
```json
{
  "success": true,
  "transactionHash": "0xbcd890...",
  "from": "0xSenderAddress...",
  "to": "0xReceiverAddress...",
  "amount": "1000",
  "gasPaidBy": "relayer",
  "message": "Transfer executed successfully"
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/relayer/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "from": "0xSender...",
    "to": "0xReceiver...",
    "amount": "1000",
    "signature": "0xSignatureBytes..."
  }'
```

**Errors**:
- `400`: Invalid signature or parameters
- `403`: Sender or receiver not on allowlist
- `403`: Insufficient balance
- `429`: Rate limit exceeded
- `500`: Transaction failed

---

### Get Relayer Status

Check relayer service health and statistics.

**Endpoint**: `GET /api/relayer/status`

**Response**:
```json
{
  "status": "operational",
  "balance": "2.5",
  "currency": "MATIC",
  "transactionsToday": 47,
  "rateLimit": {
    "maxPerMinute": 10,
    "maxPerHour": 100
  },
  "averageGasPrice": "30 gwei",
  "lastTransaction": "2025-11-04T11:45:00Z"
}
```

**Example**:
```bash
curl http://localhost:3001/api/relayer/status
```

**Errors**:
- `500`: Service unavailable

---

## Error Responses

All endpoints return consistent error responses:

### Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ADDRESS",
    "message": "The provided address is not a valid Ethereum address",
    "details": {
      "provided": "0xinvalid",
      "expected": "42-character hex string starting with 0x"
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `200` | Success | Request completed successfully |
| `400` | Bad Request | Invalid parameters, malformed JSON |
| `401` | Unauthorized | Missing or invalid API key (future) |
| `403` | Forbidden | Not on allowlist, insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Resource already exists |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Transaction failed, database error |
| `503` | Service Unavailable | Blockchain node unreachable |

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_ADDRESS` | Address format invalid |
| `INVALID_AMOUNT` | Amount must be positive integer |
| `NOT_APPROVED` | Address not on allowlist |
| `ALREADY_APPROVED` | Address already approved |
| `INSUFFICIENT_BALANCE` | Not enough tokens |
| `TRANSACTION_FAILED` | Blockchain transaction reverted |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `DATABASE_ERROR` | Internal database error |
| `NETWORK_ERROR` | Blockchain node unreachable |

### Example Error Responses

**Invalid Address**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_ADDRESS",
    "message": "Invalid Ethereum address format",
    "details": {
      "address": "0xinvalid"
    }
  }
}
```

**Not on Allowlist**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_APPROVED",
    "message": "Address not approved for transfers",
    "details": {
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "suggestion": "Use /api/admin/approve to approve this address"
    }
  }
}
```

**Transaction Failed**:
```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_FAILED",
    "message": "Transaction reverted on-chain",
    "details": {
      "reason": "ERC20: transfer amount exceeds balance",
      "transactionHash": null
    }
  }
}
```

---

## Rate Limits

Current rate limits (prototype, no authentication):

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Read operations | 100 req/min | Per IP |
| Admin operations | 10 req/min | Per IP |
| Relayer operations | 10 req/min | Per IP |

**Production**: Would implement API key-based rate limiting with tier-based quotas.

**Headers**: Rate limit info returned in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1699104000
```

---

## Webhook Support (Future)

**Status**: Not yet implemented

**Planned Features**:
- Subscribe to transfer events
- Corporate action notifications
- Allowlist changes
- Low relayer balance alerts

**Example Configuration**:
```json
{
  "url": "https://your-app.com/webhooks/chainequity",
  "events": ["transfer", "mint", "burn", "split"],
  "secret": "your_webhook_secret"
}
```

---

## SDK Support (Future)

**Status**: Not yet implemented

**Planned Libraries**:
- JavaScript/TypeScript SDK
- Python SDK
- CLI tool

**Example Usage**:
```typescript
import { ChainEquity } from '@chainequity/sdk';

const client = new ChainEquity({
  apiUrl: 'http://localhost:3001',
  apiKey: 'your_api_key'
});

// Approve wallet
await client.admin.approve('0x742d35...');

// Mint tokens
await client.admin.mint('0x742d35...', '1000');

// Get cap table
const capTable = await client.capTable.get();
```

---

## Additional Resources

- [Technical Writeup](TECHNICAL_WRITEUP.md)
- [Decision Log](DECISIONS.md)
- [Test Results](TEST_RESULTS.md)
- [Gas Report](GAS_REPORT.md)

---

**API Version**: 1.0.0
**Last Updated**: 2025-11-04
**Contact**: Bryce Harris - bharris@peak6.com
