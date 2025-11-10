const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add empty turbopack config to silence warnings for now
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Fix for MetaMask SDK and WalletConnect dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      path: false,
      os: false,
    };

    // Replace React Native dependencies with mocks/shims
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
      '@react-native-async-storage/async-storage': path.resolve(__dirname, 'app/lib/async-storage-mock.ts'),
      'pino-pretty': false,
      encoding: false,
    };

    return config;
  },
  // Disable warnings for optional dependencies
  transpilePackages: ['wagmi', '@wagmi/connectors', '@wagmi/core'],
}

module.exports = nextConfig;
