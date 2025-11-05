# Polygon Amoy Testnet Setup Guide

Follow these steps to deploy ChainEquity to Polygon Amoy testnet:

## Step 1: Get Testnet POL

You need POL tokens on Polygon Amoy testnet for gas fees.

### Option 1: Polygon Faucet (Recommended)
1. Visit: https://faucet.polygon.technology/
2. Select **Polygon Amoy**
3. Enter your wallet address
4. Complete verification
5. Receive 0.5 POL (enough for many transactions)

### Option 2: Alchemy Faucet
1. Visit: https://www.alchemy.com/faucets/polygon-amoy
2. Sign in with Alchemy account
3. Enter your wallet address
4. Receive testnet POL

### Option 3: QuickNode Faucet
1. Visit: https://faucet.quicknode.com/polygon/amoy
2. Enter your wallet address
3. Receive testnet POL

**You'll need POL for TWO addresses:**
- Your deployer/admin address (for deploying the contract)
- Your relayer address (for paying gas in the backend)

---

## Step 2: Update .env File

Edit `/Users/Apple/workspace/gauntlet/chain-equity/.env`:

```bash
# Admin/Deployer Private Key
PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE

# Relayer Private Key (different wallet for backend)
RELAYER_PRIVATE_KEY=0xYOUR_RELAYER_PRIVATE_KEY_HERE

# RPC URL (already set)
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology/

# Contract address (leave empty for now, will be filled after deployment)
CONTRACT_ADDRESS=

# Backend port
PORT=3001
```

**⚠️ SECURITY WARNING:**
- NEVER commit your private keys to git
- These are testnet keys, but treat them securely anyway
- Use separate keys for admin and relayer roles

---

## Step 3: Deploy Contract to Polygon Amoy

Run the deployment script:

```bash
cd /Users/Apple/workspace/gauntlet/chain-equity/contracts

# Deploy to Polygon Amoy
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc-amoy.polygon.technology/ \
  --broadcast \
  --verify \
  --etherscan-api-key $POLYGONSCAN_API_KEY
```

**Without verification (faster):**
```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc-amoy.polygon.technology/ \
  --broadcast
```

**The output will show:**
```
Contract Address: 0xABCDEF...123456
```

---

## Step 4: Update CONTRACT_ADDRESS in .env

Copy the deployed contract address and update `.env`:

```bash
CONTRACT_ADDRESS=0xABCDEF...123456  # Replace with your actual address
```

---

## Step 5: Restart Backend

Kill the current backend and restart:

```bash
# Stop backend
pkill -f "tsx watch src/index.ts"

# Start backend with new config
cd /Users/Apple/workspace/gauntlet/chain-equity/backend
npm run dev
```

The backend will now connect to your Polygon Amoy contract!

---

## Step 6: Connect MetaMask to Polygon Amoy

1. Open MetaMask
2. Click network dropdown (top left)
3. Click "Add Network"
4. Select **Polygon Amoy** (or add manually):
   - Network Name: Polygon Amoy Testnet
   - RPC URL: https://rpc-amoy.polygon.technology/
   - Chain ID: 80002
   - Currency Symbol: POL
   - Block Explorer: https://amoy.polygonscan.com/

5. Switch to Polygon Amoy network

---

## Step 7: Refresh Frontend

Reload the frontend in your browser. The WalletConnect errors should disappear since we're now using the correct network!

---

## Verification

### Check Contract on PolygonScan

Visit: `https://amoy.polygonscan.com/address/YOUR_CONTRACT_ADDRESS`

You should see:
- Contract deployment transaction
- Contract code (if verified)
- Token info (Name: ChainEquity, Symbol: CEQT)

### Test Backend Connection

```bash
# Check health
curl http://localhost:3001/health

# Get token info
curl http://localhost:3001/api/tokens/info

# Get cap table (should be empty initially)
curl http://localhost:3001/api/cap-table
```

### Test Frontend

1. Connect wallet (should connect to Polygon Amoy)
2. No WalletConnect errors
3. UI loads successfully
4. Cap table shows empty state

---

## Quick Command Reference

```bash
# Get testnet POL
# Visit: https://faucet.polygon.technology/

# Deploy contract
cd contracts
forge script script/Deploy.s.sol:Deploy --rpc-url https://rpc-amoy.polygon.technology/ --broadcast

# Update .env with contract address
# CONTRACT_ADDRESS=0x...

# Restart backend
cd backend
npm run dev

# Check backend health
curl http://localhost:3001/health

# View contract on explorer
# https://amoy.polygonscan.com/address/YOUR_CONTRACT_ADDRESS
```

---

## Troubleshooting

### "Insufficient funds" error
- Get more testnet POL from faucet
- Check you're on Polygon Amoy network (Chain ID: 80002)
- Verify private key has funds

### "Wrong network" in MetaMask
- Switch MetaMask to Polygon Amoy
- Verify Chain ID is 80002

### WalletConnect errors persist
- Clear browser localStorage
- Disconnect wallet and reconnect
- Try using MetaMask directly (injected connector)

### Backend can't connect to contract
- Verify CONTRACT_ADDRESS in .env is correct
- Check RPC URL is `https://rpc-amoy.polygon.technology/`
- Ensure contract was deployed successfully

---

## Next Steps After Deployment

1. **Approve your wallet:**
   ```bash
   curl -X POST http://localhost:3001/api/wallets/approve \
     -H "Content-Type: application/json" \
     -d '{"address": "0xYourWalletAddress"}'
   ```

2. **Mint tokens to yourself:**
   ```bash
   curl -X POST http://localhost:3001/api/tokens/mint \
     -H "Content-Type: application/json" \
     -d '{"to": "0xYourWalletAddress", "amount": "1000000000000000000000"}'
   ```

3. **View cap table:**
   ```bash
   curl http://localhost:3001/api/cap-table
   ```

4. **Try corporate actions:**
   - Execute a 7-for-1 stock split
   - Change the token symbol
   - All through the UI!

---

## Cost Estimate

Deploying on Polygon Amoy testnet is very cheap:

| Operation | Gas | Cost (POL) | Cost (USD) |
|-----------|-----|------------|------------|
| Deploy Contract | ~1.1M gas | ~0.002 POL | $0.001 |
| Approve Wallet | ~46k gas | ~0.0001 POL | $0.00005 |
| Mint Tokens | ~65k gas | ~0.0001 POL | $0.00005 |
| Transfer | ~39k gas | ~0.00008 POL | $0.00004 |
| Stock Split | ~30k gas | ~0.00006 POL | $0.00003 |

**Total for full demo: < 0.01 POL (< $0.01 USD)**

One faucet claim (0.5 POL) is enough for hundreds of transactions!

---

## Production Deployment (Future)

When ready for Polygon mainnet:

1. Update RPC URL to Polygon mainnet
2. Use production private keys (hardware wallet recommended)
3. Get real POL for gas
4. Deploy with same commands (different RPC)
5. Verify contract on PolygonScan
6. Set up monitoring and alerts
7. Implement proper security measures (multi-sig, access controls)

---

**You're now ready to deploy ChainEquity on Polygon Amoy testnet!** 🚀
