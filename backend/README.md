# ChainEquity Backend

Backend services for ChainEquity tokenized security platform, including relayer service, event indexer, and REST API.

## Features

- **Relayer Service**: Server-side wallet that signs and submits transactions on behalf of users
- **Event Indexer**: Real-time blockchain event monitoring with SQLite storage
- **REST API**: Complete API for wallet management, token operations, and cap table queries
- **Historical Queries**: Support for "as-of-block" cap table reconstruction

## Technology Stack

- **Node.js + TypeScript**: Type-safe backend development
- **Express**: REST API framework
- **Viem**: Modern Ethereum library for blockchain interactions
- **better-sqlite3**: Embedded database for event storage
- **Polygon Amoy**: Testnet deployment

## Prerequisites

- Node.js 18+ and npm
- Deployed ChainEquity contract on Polygon Amoy
- Relayer wallet with MATIC for gas fees

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

   Required variables:
   - `POLYGON_RPC_URL`: Polygon Amoy RPC endpoint
   - `RELAYER_PRIVATE_KEY`: Private key for transaction signing
   - `CONTRACT_ADDRESS`: Deployed contract address
   - `PORT`: Server port (default: 3001)

3. **Start development server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Wallet Management

- `POST /api/wallets/approve` - Add wallet to allowlist
  ```json
  { "address": "0x..." }
  ```

- `POST /api/wallets/revoke` - Remove wallet from allowlist
  ```json
  { "address": "0x..." }
  ```

### Token Operations

- `POST /api/tokens/mint` - Mint tokens to address
  ```json
  { "to": "0x...", "amount": "1000" }
  ```

- `GET /api/tokens/info` - Get token information

### Corporate Actions

- `POST /api/corporate-actions/split` - Execute stock split
  ```json
  { "multiplier": 7 }
  ```

- `POST /api/corporate-actions/rename` - Change token name/symbol
  ```json
  { "newName": "New Name", "newSymbol": "NEW" }
  ```

### Cap Table

- `GET /api/cap-table` - Get current cap table
- `GET /api/cap-table?blockNumber=12345` - Get historical cap table
- `GET /api/cap-table/export` - Export as CSV

### Allowlist

- `GET /api/allowlist/:address` - Check allowlist status
- `GET /api/allowlist` - Get all allowlisted addresses

### Relayer

- `POST /api/relayer/submit` - Submit pre-signed transaction
  ```json
  { "signedTransaction": "0x..." }
  ```

- `GET /api/relayer/address` - Get relayer address

### System

- `GET /health` - Health check and indexer status
- `GET /` - API documentation

## Database Schema

The backend maintains a SQLite database with the following tables:

### allowlist
Tracks approved wallet addresses
- `address` (TEXT PRIMARY KEY)
- `approved` (BOOLEAN)
- `timestamp` (INTEGER)

### balances
Current token balances for all holders
- `address` (TEXT PRIMARY KEY)
- `balance` (TEXT)
- `timestamp` (INTEGER)

### transactions
Historical transfer events
- `hash` (TEXT PRIMARY KEY)
- `from_addr` (TEXT)
- `to_addr` (TEXT)
- `amount` (TEXT)
- `block_number` (INTEGER)
- `timestamp` (INTEGER)

### corporate_actions
Stock splits and symbol changes
- `id` (INTEGER PRIMARY KEY)
- `type` (TEXT: 'split' or 'rename')
- `data` (TEXT: JSON)
- `block_number` (INTEGER)
- `timestamp` (INTEGER)

### indexer_state
Tracks last indexed block
- `id` (INTEGER PRIMARY KEY)
- `last_indexed_block` (INTEGER)
- `updated_at` (INTEGER)

## Event Indexer

The indexer monitors these contract events:

- **Transfer**: Updates balances, stores transaction history
- **Mint**: Records token minting events
- **AllowlistUpdated**: Tracks wallet approvals/revocations
- **StockSplit**: Records split events, updates balances
- **SymbolChanged**: Records name/symbol changes

### Indexer Features

- Automatic historical catch-up on startup
- Real-time polling (5-second interval)
- Block-based state tracking
- Efficient batch processing (1000 blocks per query)

## Architecture

```
src/
├── index.ts              # Express server entry point
├── types/                # TypeScript type definitions
│   └── index.ts
├── db/                   # Database layer
│   ├── init.ts           # Database initialization
│   ├── schema.ts         # Table schemas
│   └── queries.ts        # Database queries
├── services/             # Business logic
│   ├── blockchain.ts     # Viem blockchain service
│   └── indexer.ts        # Event indexer
├── routes/               # API routes
│   ├── wallets.ts        # Wallet management
│   ├── tokens.ts         # Token operations
│   ├── corporate-actions.ts # Corporate actions
│   ├── cap-table.ts      # Cap table queries
│   ├── allowlist.ts      # Allowlist queries
│   └── relayer.ts        # Relayer operations
└── utils/                # Utilities
    └── contract-abi.ts   # Contract ABI
```

## Development

### Build for production
```bash
npm run build
npm start
```

### Type checking
```bash
npm run typecheck
```

## Key Implementation Notes

### Relayer Pattern
The backend uses a relayer pattern where the server wallet signs all transactions. This provides:
- Gasless transactions for users (server pays gas)
- Centralized access control
- Simplified user experience

### Historical Cap Table Reconstruction
Cap tables at any historical block are reconstructed by:
1. Querying all transactions up to the target block
2. Replaying transfers to calculate balances
3. Computing ownership percentages

This approach allows time-travel queries without storing snapshots.

### Viem vs Ethers
We use Viem instead of Ethers.js for:
- Better TypeScript support
- Smaller bundle size
- More modern API design
- Better performance

## Logging

All blockchain operations are logged with:
- Transaction hashes
- Block numbers
- Gas costs
- Error details

Check console output for operational insights.

## Error Handling

The API returns consistent error responses:
```json
{
  "success": false,
  "error": "Error message"
}
```

All blockchain errors are caught and returned with descriptive messages.

## Security Considerations

1. **Private Key Management**: Never commit `.env` file
2. **Relayer Wallet**: Keep funded with MATIC for gas
3. **Rate Limiting**: Consider adding rate limits in production
4. **Input Validation**: All inputs are validated before blockchain submission
5. **CORS**: Configure appropriately for production

## Troubleshooting

### "Database not initialized" error
Ensure `initializeDatabase()` is called before using database queries.

### "Contract not found" error
Verify `CONTRACT_ADDRESS` is correct and contract is deployed.

### Indexer not catching up
Check RPC connection and ensure sufficient RPC rate limits.

### Transaction failures
Ensure relayer wallet has sufficient MATIC for gas fees.

## Production Deployment

For production deployment:
1. Use environment-specific RPC URLs (not public endpoints)
2. Implement proper logging (Winston, Pino)
3. Add monitoring (Prometheus, DataDog)
4. Configure rate limiting
5. Use PostgreSQL instead of SQLite for scale
6. Add authentication/authorization
7. Enable HTTPS
8. Set up backup strategies

## License

MIT
