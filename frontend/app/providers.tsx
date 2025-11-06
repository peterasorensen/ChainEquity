'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, walletConnect } from 'wagmi/connectors';
import { ReactNode } from 'react';

// Define Polygon Amoy chain with flexible configuration
// This matches the standard Polygon Amoy testnet
export const polygonAmoy = defineChain({
  id: 80002,
  name: 'Polygon Amoy Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: ['https://polygon-amoy.drpc.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'PolygonScan',
      url: 'https://amoy.polygonscan.com',
    },
  },
  testnet: true,
});

// Create Wagmi config for Polygon Amoy testnet
const config = createConfig({
  chains: [polygonAmoy],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
      showQrModal: true,
      metadata: {
        name: 'ChainEquity',
        description: 'Tokenized Security Platform',
        url: 'https://chainequity.example',
        icons: ['https://avatars.githubusercontent.com/u/37784886']
      },
    }),
  ],
  transports: {
    [polygonAmoy.id]: http('https://polygon-amoy.drpc.org'),
  },
  multiInjectedProviderDiscovery: false,
  ssr: false,
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
