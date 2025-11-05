# Backend Quick Start Guide

## Prerequisites
1. Node.js 18+ installed
2. Deployed ChainEquity contract on Polygon Amoy
3. Relayer wallet with MATIC for gas fees

## Setup Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual values
nano .env
```

Required values:
- `POLYGON_RPC_URL`: Use `https://rpc-amoy.polygon.technology/`
- `RELAYER_PRIVATE_KEY`: Your server wallet's private key (must have MATIC)
- `CONTRACT_ADDRESS`: Your deployed ChainEquity contract address
- `PORT`: 3001 (or your preferred port)

### 3. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

## Verify Installation

### Check Health
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-04T...",
  "services": {
    "database": "connected",
    "blockchain": "connected",
    "indexer": "running",
    "lastIndexedBlock": 12345
  }
}
```

### Get API Documentation
```bash
curl http://localhost:3001/
```

## Test API Endpoints

### 1. Approve a Wallet
```bash
curl -X POST http://localhost:3001/api/wallets/approve \
  -H "Content-Type: application/json" \
  -d '{"address": "0xYourWalletAddress"}'
```

### 2. Mint Tokens
```bash
curl -X POST http://localhost:3001/api/tokens/mint \
  -H "Content-Type: application/json" \
  -d '{"to": "0xYourWalletAddress", "amount": "1000"}'
```

### 3. Get Cap Table
```bash
curl http://localhost:3001/api/cap-table
```

### 4. Check Allowlist Status
```bash
curl http://localhost:3001/api/allowlist/0xYourWalletAddress
```

## Common Operations

### Execute Stock Split (7-for-1)
```bash
curl -X POST http://localhost:3001/api/corporate-actions/split \
  -H "Content-Type: application/json" \
  -d '{"multiplier": 7}'
```

### Change Token Symbol
```bash
curl -X POST http://localhost:3001/api/corporate-actions/rename \
  -H "Content-Type: application/json" \
  -d '{"newName": "New Company Name", "newSymbol": "NCN"}'
```

### Export Cap Table as CSV
```bash
curl http://localhost:3001/api/cap-table/export > cap-table.csv
```

### Get Historical Cap Table
```bash
# At specific block
curl "http://localhost:3001/api/cap-table?blockNumber=12345"
```

## Troubleshooting

### Error: "Contract address is not set"
- Ensure `CONTRACT_ADDRESS` is set in `.env`
- Verify the contract is actually deployed at that address

### Error: "Insufficient funds"
- Relayer wallet needs MATIC for gas
- Get testnet MATIC from: https://faucet.polygon.technology/

### Indexer not updating
- Check RPC connection
- Verify contract address is correct
- Look for error logs in console

### Database locked errors
- Stop all running instances
- Delete `*.db-wal` and `*.db-shm` files
- Restart server

## What Happens on Startup

1. **Database Initialization**: Creates SQLite database with schema
2. **Blockchain Connection**: Connects to Polygon Amoy via RPC
3. **Contract Verification**: Loads contract and verifies connection
4. **Indexer Start**: Begins monitoring blockchain events
5. **API Server**: Starts Express server on configured port

The indexer will:
- Catch up on any missed blocks since last run
- Poll for new blocks every 5 seconds
- Store all events in the database
- Update balances in real-time

## Files Created

After running:
- `chainequity.db`: SQLite database (auto-created)
- `chainequity.db-wal`: Write-ahead log (auto-created)
- `chainequity.db-shm`: Shared memory file (auto-created)

## Next Steps

1. Test all API endpoints
2. Verify indexer is catching events
3. Check cap table accuracy
4. Test corporate actions
5. Export cap table snapshots

## Development Tips

- Use `npm run dev` for auto-reload during development
- Check logs for transaction hashes
- Verify transactions on: https://amoy.polygonscan.com/
- Use Postman or Thunder Client for API testing

## Production Checklist

Before deploying to production:
- [ ] Use dedicated RPC endpoint (not public)
- [ ] Secure relayer private key
- [ ] Add rate limiting
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Add authentication
- [ ] Review CORS settings
- [ ] Enable proper logging
- [ ] Test disaster recovery

## Support

For issues or questions:
1. Check the main README.md
2. Review API documentation at `GET /`
3. Check health endpoint at `GET /health`
4. Review console logs for errors
