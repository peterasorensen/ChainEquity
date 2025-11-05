'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, walletConnect } from 'wagmi/connectors';
import { ReactNode } from 'react';

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
    [polygonAmoy.id]: http('https://rpc-amoy.polygon.technology'),
  },
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
