# ChainEquity Frontend

Modern equity management platform UI built with Next.js 14, TypeScript, and Wagmi.

## Tech Stack

- **Next.js 14** - App Router for modern React development
- **TypeScript** - Type-safe development
- **Wagmi** - Ethereum wallet connection and interaction
- **Viem** - Lightweight Ethereum library
- **Recharts** - Data visualization for cap table charts
- **CSS Modules** - Component-scoped styling

## Design Philosophy

Clean, professional design inspired by Carta and Polymarket:
- Blue-focused color palette (#2563eb primary)
- Professional typography
- Card-based layouts with subtle shadows
- Responsive and accessible UI

## Features

### 1. Cap Table Visualization
- Donut charts for ownership distribution
- Amount raised by share class
- Detailed share class table
- Real-time data refresh

### 2. Allowlist Management
- Approve/revoke wallet addresses
- Real-time validation
- Status indicators
- Address list with search

### 3. Token Minting
- Mint tokens to approved addresses
- Allowlist verification
- Transaction status tracking
- Input validation

### 4. Corporate Actions
- **Stock Splits**: Execute forward splits with custom multipliers
- **Symbol Changes**: Update token name and symbol
- Transaction confirmations
- Current state display

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on port 3001
- MetaMask or compatible Web3 wallet

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your values
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```

### Development

```bash
# Run development server
npm run dev

# Open http://localhost:3000
```

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── components/
│   │   ├── Header.tsx/module.css         # Wallet connection header
│   │   ├── Sidebar.tsx/module.css        # Navigation sidebar
│   │   ├── CapTable.tsx/module.css       # Cap table with charts
│   │   ├── AllowlistManager.tsx/.module.css
│   │   ├── MintTokens.tsx/module.css
│   │   └── CorporateActions.tsx/module.css
│   ├── lib/
│   │   └── api.ts                        # API integration layer
│   ├── globals.css                       # Global styles & design system
│   ├── layout.tsx                        # Root layout
│   ├── page.tsx                          # Main dashboard page
│   └── providers.tsx                     # Wagmi & React Query setup
├── next.config.js
├── tsconfig.json
└── package.json
```

## Component Overview

### Header
- Wallet connection/disconnection
- Network indicator
- Connected address display

### Sidebar
- Navigation between sections
- Active state highlighting
- Icon-based menu items

### Cap Table
- Ownership pie chart (Recharts)
- Fundraising visualization
- Share class table with all metrics
- Stats cards (total supply, raised, classes)

### Allowlist Manager
- Add/remove addresses from allowlist
- Real-time approval status
- Address validation
- Bulk operations support

### Mint Tokens
- Issue new equity tokens
- Recipient allowlist validation
- Amount input with validation
- Transaction tracking

### Corporate Actions
- Stock split execution
- Token rebranding (name/symbol)
- Warning messages for irreversible actions
- Current state display

## Styling Approach

**NO Tailwind** - Uses CSS Modules and vanilla CSS:

- `globals.css` - Design system, utilities, base styles
- `*.module.css` - Component-specific styles
- CSS custom properties for theming
- Responsive grid layouts

### Color Palette

```css
--color-primary: #2563eb        /* Primary blue */
--color-primary-hover: #1d4ed8  /* Hover state */
--color-gray-50: #f9fafb        /* Light background */
--color-gray-900: #111827       /* Text primary */
```

## API Integration

All backend calls are centralized in `/app/lib/api.ts`:

```typescript
// Example usage
import { getCapTableData, mintTokens } from '@/lib/api';

const data = await getCapTableData();
const result = await mintTokens({ recipient, amount });
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API endpoint
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect integration

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers with Web3 support

## Contributing

1. Follow existing code style
2. Use TypeScript strict mode
3. Write semantic HTML
4. Use CSS Modules for styling
5. Test wallet connection flows
6. Ensure responsive design

## License

MIT
