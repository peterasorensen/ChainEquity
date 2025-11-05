# ChainEquity Frontend - Quick Start Guide

## Installation & Setup

### 1. Install Dependencies

```bash
cd /Users/Apple/workspace/gauntlet/chain-equity/frontend
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your settings
# NEXT_PUBLIC_API_URL=http://localhost:3001
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

## First Time Setup

### Connect Your Wallet

1. Open http://localhost:3000
2. Click "Connect Wallet" in the top right
3. Select MetaMask or WalletConnect
4. Approve the connection in your wallet
5. Make sure you're on Polygon Amoy testnet

### Navigation

Once connected, you'll see the sidebar with four sections:

1. **Cap Table** - View ownership structure
2. **Allowlist** - Manage approved addresses
3. **Mint Tokens** - Issue new equity
4. **Corporate Actions** - Execute splits and rebranding

## Using the Dashboard

### Cap Table

- View donut charts for ownership distribution
- See amount raised by share class
- Review detailed share class table
- Click "Refresh Data" to update

### Allowlist Management

1. Enter a wallet address (0x...)
2. Click "Approve Address" to add to allowlist
3. View all approved addresses in the table
4. Click "Revoke" to remove an address

### Mint Tokens

1. Enter recipient address (must be approved first)
2. System will automatically check if address is allowlisted
3. Enter amount to mint
4. Click "Mint Tokens"
5. Confirm transaction in wallet
6. View transaction hash on success

### Corporate Actions

**Stock Split:**
1. Enter split multiplier (e.g., 7 for 7-for-1 split)
2. Click "Execute Stock Split"
3. Confirm the action
4. Approve transaction in wallet

**Change Symbol:**
1. Enter new token name
2. Enter new symbol (ticker)
3. Click "Change Symbol"
4. Confirm the action
5. Approve transaction in wallet

## Troubleshooting

### Wallet Won't Connect
- Ensure MetaMask is installed
- Check you're on Polygon Amoy testnet
- Try refreshing the page

### API Errors
- Verify backend is running on port 3001
- Check NEXT_PUBLIC_API_URL in .env.local
- Review browser console for errors

### Transaction Failures
- Ensure you have enough MATIC for gas
- Verify you're using the admin wallet
- Check contract addresses are correct

### Charts Not Displaying
- Verify backend API is returning data
- Check browser console for errors
- Try refreshing the cap table data

## Development Tips

### Hot Reload
- Changes to .tsx/.ts files reload automatically
- CSS Module changes also hot reload
- Provider changes may require full refresh

### Testing with Different Wallets
1. Use MetaMask account switcher
2. Test admin vs. regular user flows
3. Verify allowlist restrictions work

### Styling Changes
- Global styles: `app/globals.css`
- Component styles: `*.module.css` files
- Use CSS custom properties for colors

## Build for Production

```bash
# Create optimized production build
npm run build

# Test production build locally
npm start
```

## Next Steps

1. Get WalletConnect Project ID from https://cloud.walletconnect.com/
2. Update .env.local with real project ID
3. Configure backend API endpoints
4. Test all features with real contracts
5. Deploy to Vercel or your hosting platform

## Support

For issues or questions:
- Review the main README.md
- Check the backend API documentation
- Review contract deployment docs
