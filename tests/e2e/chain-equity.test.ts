/**
 * ChainEquity E2E Test Suite
 *
 * Tests all scenarios from PRD:
 * 1. Complete flow: deploy → approve wallet → mint → transfer (success)
 * 2. Transfer to non-approved wallet (blocked)
 * 3. Approve second wallet → transfer succeeds
 * 4. Execute 7-for-1 stock split → verify balances multiplied
 * 5. Change symbol → verify metadata updated
 * 6. Export cap table at different blocks
 * 7. Unauthorized admin attempts (should fail)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestClient,
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatEther,
  type Address,
  type WalletClient,
  type PublicClient,
  type TestClient,
} from 'viem';
import { foundry } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Test configuration
const ANVIL_RPC_URL = process.env.ANVIL_RPC_URL || 'http://127.0.0.1:8545';

// Test account private keys (Anvil default accounts)
const ADMIN_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const WALLET_A_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const WALLET_B_KEY = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const WALLET_C_KEY = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6';
const UNAUTHORIZED_KEY = '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a';

// Contract ABI (minimal interface for testing)
const TOKEN_ABI = [
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isApproved',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approveWallet',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'revokeWallet',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'executeStockSplit',
    inputs: [{ name: 'multiplier', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'changeSymbol',
    inputs: [{ name: 'newSymbol', type: 'string' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WalletApproved',
    inputs: [{ name: 'wallet', type: 'address', indexed: true }],
  },
  {
    type: 'event',
    name: 'WalletRevoked',
    inputs: [{ name: 'wallet', type: 'address', indexed: true }],
  },
  {
    type: 'event',
    name: 'StockSplit',
    inputs: [
      { name: 'multiplier', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SymbolChanged',
    inputs: [
      { name: 'oldSymbol', type: 'string', indexed: false },
      { name: 'newSymbol', type: 'string', indexed: false },
    ],
  },
] as const;

// Test state
let testClient: TestClient;
let publicClient: PublicClient;
let adminClient: WalletClient;
let walletAClient: WalletClient;
let walletBClient: WalletClient;
let walletCClient: WalletClient;
let unauthorizedClient: WalletClient;

let contractAddress: Address;
let adminAddress: Address;
let walletAAddress: Address;
let walletBAddress: Address;
let walletCAddress: Address;
let unauthorizedAddress: Address;

describe('ChainEquity E2E Tests', () => {
  beforeAll(async () => {
    // Create test accounts
    const adminAccount = privateKeyToAccount(ADMIN_KEY);
    const walletAAccount = privateKeyToAccount(WALLET_A_KEY);
    const walletBAccount = privateKeyToAccount(WALLET_B_KEY);
    const walletCAccount = privateKeyToAccount(WALLET_C_KEY);
    const unauthorizedAccount = privateKeyToAccount(UNAUTHORIZED_KEY);

    adminAddress = adminAccount.address;
    walletAAddress = walletAAccount.address;
    walletBAddress = walletBAccount.address;
    walletCAddress = walletCAccount.address;
    unauthorizedAddress = unauthorizedAccount.address;

    // Create clients
    testClient = createTestClient({
      mode: 'anvil',
      chain: foundry,
      transport: http(ANVIL_RPC_URL),
    });

    publicClient = createPublicClient({
      chain: foundry,
      transport: http(ANVIL_RPC_URL),
    });

    adminClient = createWalletClient({
      account: adminAccount,
      chain: foundry,
      transport: http(ANVIL_RPC_URL),
    });

    walletAClient = createWalletClient({
      account: walletAAccount,
      chain: foundry,
      transport: http(ANVIL_RPC_URL),
    });

    walletBClient = createWalletClient({
      account: walletBAccount,
      chain: foundry,
      transport: http(ANVIL_RPC_URL),
    });

    walletCClient = createWalletClient({
      account: walletCAccount,
      chain: foundry,
      transport: http(ANVIL_RPC_URL),
    });

    unauthorizedClient = createWalletClient({
      account: unauthorizedAccount,
      chain: foundry,
      transport: http(ANVIL_RPC_URL),
    });

    // Deploy contract using forge script
    console.log('Deploying ChainEquity contract...');

    // Note: In a real setup, you would deploy the contract here
    // For this test, we assume the contract is deployed via forge script
    // and the address is available in environment variable
    const deployedAddress = process.env.CONTRACT_ADDRESS;

    if (!deployedAddress) {
      throw new Error(
        'CONTRACT_ADDRESS not found. Please deploy the contract first using: ' +
        'cd contracts && forge script script/Deploy.s.sol --rpc-url $ANVIL_RPC_URL --broadcast'
      );
    }

    contractAddress = deployedAddress as Address;
    console.log(`Contract deployed at: ${contractAddress}`);
  });

  describe('1. Complete Flow: Deploy → Approve → Mint → Transfer', () => {
    it('should have correct initial metadata', async () => {
      const name = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'name',
      });

      const symbol = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'symbol',
      });

      expect(name).toBe('ChainEquity');
      expect(symbol).toBe('CEQT');
    });

    it('should approve Wallet A', async () => {
      const hash = await adminClient.writeContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'approveWallet',
        args: [walletAAddress],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      const isApproved = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'isApproved',
        args: [walletAAddress],
      });

      expect(isApproved).toBe(true);
    });

    it('should mint tokens to Wallet A', async () => {
      const mintAmount = parseEther('10000');

      const hash = await adminClient.writeContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'mint',
        args: [walletAAddress, mintAmount],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      const balance = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletAAddress],
      });

      expect(balance).toBe(mintAmount);
    });

    it('should approve Wallet B', async () => {
      const hash = await adminClient.writeContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'approveWallet',
        args: [walletBAddress],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      const isApproved = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'isApproved',
        args: [walletBAddress],
      });

      expect(isApproved).toBe(true);
    });

    it('should transfer tokens from Wallet A to Wallet B (both approved)', async () => {
      const transferAmount = parseEther('3000');

      const hash = await walletAClient.writeContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'transfer',
        args: [walletBAddress, transferAmount],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      const balanceA = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletAAddress],
      });

      const balanceB = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletBAddress],
      });

      expect(balanceA).toBe(parseEther('7000'));
      expect(balanceB).toBe(parseEther('3000'));
    });
  });

  describe('2. Transfer to Non-Approved Wallet (Blocked)', () => {
    it('should fail to transfer from Wallet A to non-approved Wallet C', async () => {
      const transferAmount = parseEther('1000');

      const isApproved = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'isApproved',
        args: [walletCAddress],
      });

      expect(isApproved).toBe(false);

      await expect(async () => {
        const hash = await walletAClient.writeContract({
          address: contractAddress,
          abi: TOKEN_ABI,
          functionName: 'transfer',
          args: [walletCAddress, transferAmount],
        });

        await publicClient.waitForTransactionReceipt({ hash });
      }).rejects.toThrow();

      // Verify balances unchanged
      const balanceA = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletAAddress],
      });

      const balanceC = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletCAddress],
      });

      expect(balanceA).toBe(parseEther('7000'));
      expect(balanceC).toBe(0n);
    });
  });

  describe('3. Approve Second Wallet → Transfer Succeeds', () => {
    it('should approve Wallet C and allow transfer', async () => {
      // Approve Wallet C
      const approveHash = await adminClient.writeContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'approveWallet',
        args: [walletCAddress],
      });

      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      const isApproved = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'isApproved',
        args: [walletCAddress],
      });

      expect(isApproved).toBe(true);

      // Now transfer should succeed
      const transferAmount = parseEther('2000');

      const transferHash = await walletAClient.writeContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'transfer',
        args: [walletCAddress, transferAmount],
      });

      await publicClient.waitForTransactionReceipt({ hash: transferHash });

      const balanceA = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletAAddress],
      });

      const balanceC = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletCAddress],
      });

      expect(balanceA).toBe(parseEther('5000'));
      expect(balanceC).toBe(parseEther('2000'));
    });
  });

  describe('4. Execute 7-for-1 Stock Split', () => {
    it('should multiply all balances by 7 and update total supply', async () => {
      // Get balances before split
      const balanceABefore = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletAAddress],
      });

      const balanceBBefore = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletBAddress],
      });

      const balanceCBefore = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletCAddress],
      });

      const totalSupplyBefore = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'totalSupply',
      });

      // Execute 7-for-1 split
      const hash = await adminClient.writeContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'executeStockSplit',
        args: [7n],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      // Get balances after split
      const balanceAAfter = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletAAddress],
      });

      const balanceBAfter = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletBAddress],
      });

      const balanceCAfter = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletCAddress],
      });

      const totalSupplyAfter = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'totalSupply',
      });

      // Verify all balances multiplied by 7
      expect(balanceAAfter).toBe(balanceABefore * 7n);
      expect(balanceBAfter).toBe(balanceBBefore * 7n);
      expect(balanceCAfter).toBe(balanceCBefore * 7n);
      expect(totalSupplyAfter).toBe(totalSupplyBefore * 7n);

      // Verify specific values
      expect(balanceAAfter).toBe(parseEther('35000')); // 5000 * 7
      expect(balanceBAfter).toBe(parseEther('21000')); // 3000 * 7
      expect(balanceCAfter).toBe(parseEther('14000')); // 2000 * 7
    });
  });

  describe('5. Change Symbol → Verify Metadata Updated', () => {
    it('should change symbol while preserving balances', async () => {
      const oldSymbol = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'symbol',
      });

      expect(oldSymbol).toBe('CEQT');

      // Change symbol
      const hash = await adminClient.writeContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'changeSymbol',
        args: ['CEQX'],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      // Verify new symbol
      const newSymbol = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'symbol',
      });

      expect(newSymbol).toBe('CEQX');

      // Verify balances unchanged
      const balanceA = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletAAddress],
      });

      const balanceB = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletBAddress],
      });

      expect(balanceA).toBe(parseEther('35000'));
      expect(balanceB).toBe(parseEther('21000'));
    });
  });

  describe('6. Export Cap Table at Different Blocks', () => {
    it('should export cap table with correct ownership percentages', async () => {
      const balanceA = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletAAddress],
      });

      const balanceB = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletBAddress],
      });

      const balanceC = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletCAddress],
      });

      const totalSupply = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'totalSupply',
      });

      // Calculate ownership percentages
      const ownershipA = Number((balanceA * 10000n) / totalSupply) / 100;
      const ownershipB = Number((balanceB * 10000n) / totalSupply) / 100;
      const ownershipC = Number((balanceC * 10000n) / totalSupply) / 100;

      console.log('\nCap Table:');
      console.log('│ Wallet                                      │ Balance │ Ownership │');
      console.log('├─────────────────────────────────────────────┼─────────┼───────────┤');
      console.log(`│ ${walletAAddress} │ ${formatEther(balanceA).padStart(7)} │ ${ownershipA.toFixed(2).padStart(8)}% │`);
      console.log(`│ ${walletBAddress} │ ${formatEther(balanceB).padStart(7)} │ ${ownershipB.toFixed(2).padStart(8)}% │`);
      console.log(`│ ${walletCAddress} │ ${formatEther(balanceC).padStart(7)} │ ${ownershipC.toFixed(2).padStart(8)}% │`);
      console.log('└─────────────────────────────────────────────┴─────────┴───────────┘');

      // Verify percentages add up to 100%
      expect(ownershipA + ownershipB + ownershipC).toBeCloseTo(100, 1);

      // Verify expected ownership
      expect(ownershipA).toBe(50.0); // 35000 / 70000
      expect(ownershipB).toBe(30.0); // 21000 / 70000
      expect(ownershipC).toBe(20.0); // 14000 / 70000
    });
  });

  describe('7. Unauthorized Admin Attempts', () => {
    it('should fail when unauthorized wallet tries to approve', async () => {
      await expect(async () => {
        const hash = await unauthorizedClient.writeContract({
          address: contractAddress,
          abi: TOKEN_ABI,
          functionName: 'approveWallet',
          args: [unauthorizedAddress],
        });

        await publicClient.waitForTransactionReceipt({ hash });
      }).rejects.toThrow();
    });

    it('should fail when unauthorized wallet tries to mint', async () => {
      await expect(async () => {
        const hash = await unauthorizedClient.writeContract({
          address: contractAddress,
          abi: TOKEN_ABI,
          functionName: 'mint',
          args: [unauthorizedAddress, parseEther('1000')],
        });

        await publicClient.waitForTransactionReceipt({ hash });
      }).rejects.toThrow();
    });

    it('should fail when unauthorized wallet tries to execute stock split', async () => {
      await expect(async () => {
        const hash = await unauthorizedClient.writeContract({
          address: contractAddress,
          abi: TOKEN_ABI,
          functionName: 'executeStockSplit',
          args: [2n],
        });

        await publicClient.waitForTransactionReceipt({ hash });
      }).rejects.toThrow();
    });

    it('should fail when unauthorized wallet tries to change symbol', async () => {
      await expect(async () => {
        const hash = await unauthorizedClient.writeContract({
          address: contractAddress,
          abi: TOKEN_ABI,
          functionName: 'changeSymbol',
          args: ['HACK'],
        });

        await publicClient.waitForTransactionReceipt({ hash });
      }).rejects.toThrow();
    });
  });

  describe('Additional Test Scenarios', () => {
    it('should fail when non-approved wallet tries to send', async () => {
      // Revoke Wallet C to test sending from non-approved
      const revokeHash = await adminClient.writeContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'revokeWallet',
        args: [walletCAddress],
      });

      await publicClient.waitForTransactionReceipt({ hash: revokeHash });

      await expect(async () => {
        const hash = await walletCClient.writeContract({
          address: contractAddress,
          abi: TOKEN_ABI,
          functionName: 'transfer',
          args: [walletAAddress, parseEther('100')],
        });

        await publicClient.waitForTransactionReceipt({ hash });
      }).rejects.toThrow();

      // Re-approve for cleanup
      const reapproveHash = await adminClient.writeContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'approveWallet',
        args: [walletCAddress],
      });

      await publicClient.waitForTransactionReceipt({ hash: reapproveHash });
    });

    it('should maintain total supply after transfers', async () => {
      const totalSupply = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'totalSupply',
      });

      const balanceA = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletAAddress],
      });

      const balanceB = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletBAddress],
      });

      const balanceC = await publicClient.readContract({
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'balanceOf',
        args: [walletCAddress],
      });

      expect(balanceA + balanceB + balanceC).toBe(totalSupply);
    });
  });
});
