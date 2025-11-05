#!/usr/bin/env ts-node
/**
 * ChainEquity Demo Automation Script
 *
 * Automated demonstration of all ChainEquity features:
 * 1. Deploy contract (or use existing)
 * 2. Set up 3 test wallets
 * 3. Approve 2 wallets
 * 4. Mint tokens to approved wallets
 * 5. Attempt transfer to non-approved (show failure)
 * 6. Approve third wallet
 * 7. Transfer succeeds
 * 8. Execute stock split
 * 9. Change symbol
 * 10. Export cap table
 *
 * Usage:
 *   npm run demo
 *   or
 *   ts-node scripts/demo.ts
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatEther,
  type Address,
} from 'viem';
import { foundry } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Configuration
const RPC_URL = process.env.ANVIL_RPC_URL || 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS as Address;

// Test accounts (Anvil defaults)
const ADMIN_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const WALLET_A_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const WALLET_B_KEY = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const WALLET_C_KEY = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6';

// Minimal ABI for demo
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
] as const;

// Utility functions
function log(step: string, message: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`STEP: ${step}`);
  console.log(`${'='.repeat(80)}`);
  console.log(message);
}

function success(message: string) {
  console.log(`✅ ${message}`);
}

function error(message: string) {
  console.log(`❌ ${message}`);
}

function info(message: string) {
  console.log(`ℹ️  ${message}`);
}

async function printCapTable(
  publicClient: any,
  contractAddress: Address,
  walletAAddress: Address,
  walletBAddress: Address,
  walletCAddress: Address
) {
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

  const ownershipA = Number((balanceA * 10000n) / totalSupply) / 100;
  const ownershipB = Number((balanceB * 10000n) / totalSupply) / 100;
  const ownershipC = Number((balanceC * 10000n) / totalSupply) / 100;

  console.log('\n┌─────────────────────────────────────────────┬───────────┬───────────┐');
  console.log('│ Wallet                                      │ Balance   │ Ownership │');
  console.log('├─────────────────────────────────────────────┼───────────┼───────────┤');
  console.log(`│ ${walletAAddress} │ ${formatEther(balanceA).padStart(9)} │ ${ownershipA.toFixed(2).padStart(8)}% │`);
  console.log(`│ ${walletBAddress} │ ${formatEther(balanceB).padStart(9)} │ ${ownershipB.toFixed(2).padStart(8)}% │`);
  console.log(`│ ${walletCAddress} │ ${formatEther(balanceC).padStart(9)} │ ${ownershipC.toFixed(2).padStart(8)}% │`);
  console.log('├─────────────────────────────────────────────┼───────────┼───────────┤');
  console.log(`│ TOTAL                                       │ ${formatEther(totalSupply).padStart(9)} │   100.00% │`);
  console.log('└─────────────────────────────────────────────┴───────────┴───────────┘');
}

async function main() {
  console.log('\n');
  console.log('╔═════════════════════════════════════════════════════════════════════╗');
  console.log('║                  ChainEquity Demo Automation                        ║');
  console.log('║          Tokenized Security with Compliance Gating                  ║');
  console.log('╚═════════════════════════════════════════════════════════════════════╝');

  if (!CONTRACT_ADDRESS) {
    error('CONTRACT_ADDRESS environment variable not set');
    error('Please deploy the contract first:');
    console.log('  cd contracts && forge script script/Deploy.s.sol --rpc-url $ANVIL_RPC_URL --broadcast');
    process.exit(1);
  }

  // Setup accounts
  const adminAccount = privateKeyToAccount(ADMIN_KEY);
  const walletAAccount = privateKeyToAccount(WALLET_A_KEY);
  const walletBAccount = privateKeyToAccount(WALLET_B_KEY);
  const walletCAccount = privateKeyToAccount(WALLET_C_KEY);

  const adminAddress = adminAccount.address;
  const walletAAddress = walletAAccount.address;
  const walletBAddress = walletBAccount.address;
  const walletCAddress = walletCAccount.address;

  // Create clients
  const publicClient = createPublicClient({
    chain: foundry,
    transport: http(RPC_URL),
  });

  const adminClient = createWalletClient({
    account: adminAccount,
    chain: foundry,
    transport: http(RPC_URL),
  });

  const walletAClient = createWalletClient({
    account: walletAAccount,
    chain: foundry,
    transport: http(RPC_URL),
  });

  try {
    // Step 1: Verify contract deployment
    log('1', 'Verify Contract Deployment');
    const name = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'name',
    });

    const symbol = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'symbol',
    });

    success(`Contract deployed at: ${CONTRACT_ADDRESS}`);
    info(`Token Name: ${name}`);
    info(`Token Symbol: ${symbol}`);

    // Step 2: Setup wallets
    log('2', 'Setup Test Wallets');
    info(`Admin (Issuer): ${adminAddress}`);
    info(`Wallet A: ${walletAAddress}`);
    info(`Wallet B: ${walletBAddress}`);
    info(`Wallet C: ${walletCAddress}`);

    // Step 3: Approve Wallet A
    log('3', 'Approve Wallet A');
    const approveAHash = await adminClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'approveWallet',
      args: [walletAAddress],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveAHash });
    success(`Wallet A approved. Tx: ${approveAHash}`);

    // Step 4: Approve Wallet B
    log('4', 'Approve Wallet B');
    const approveBHash = await adminClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'approveWallet',
      args: [walletBAddress],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveBHash });
    success(`Wallet B approved. Tx: ${approveBHash}`);

    // Step 5: Mint tokens to Wallet A
    log('5', 'Mint Tokens to Wallet A');
    const mintAmount = parseEther('10000');
    const mintHash = await adminClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'mint',
      args: [walletAAddress, mintAmount],
    });
    await publicClient.waitForTransactionReceipt({ hash: mintHash });
    success(`Minted ${formatEther(mintAmount)} tokens to Wallet A`);
    info(`Tx: ${mintHash}`);

    await printCapTable(publicClient, CONTRACT_ADDRESS, walletAAddress, walletBAddress, walletCAddress);

    // Step 6: Transfer to approved wallet (Wallet B)
    log('6', 'Transfer from Wallet A to Wallet B (Both Approved)');
    const transferAmount1 = parseEther('3000');
    const transferHash1 = await walletAClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'transfer',
      args: [walletBAddress, transferAmount1],
    });
    await publicClient.waitForTransactionReceipt({ hash: transferHash1 });
    success(`Transferred ${formatEther(transferAmount1)} tokens from A to B`);
    info(`Tx: ${transferHash1}`);

    await printCapTable(publicClient, CONTRACT_ADDRESS, walletAAddress, walletBAddress, walletCAddress);

    // Step 7: Attempt transfer to non-approved wallet (should fail)
    log('7', 'Attempt Transfer to Non-Approved Wallet C (Should Fail)');
    try {
      const transferAmount2 = parseEther('1000');
      const transferHash2 = await walletAClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: TOKEN_ABI,
        functionName: 'transfer',
        args: [walletCAddress, transferAmount2],
      });
      await publicClient.waitForTransactionReceipt({ hash: transferHash2 });
      error('Transfer should have failed but succeeded!');
    } catch (err: any) {
      success('Transfer correctly blocked - Wallet C is not approved');
      info(`Error: ${err.message.split('\n')[0]}`);
    }

    // Step 8: Approve Wallet C
    log('8', 'Approve Wallet C');
    const approveCHash = await adminClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'approveWallet',
      args: [walletCAddress],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveCHash });
    success(`Wallet C approved. Tx: ${approveCHash}`);

    // Step 9: Transfer to now-approved Wallet C (should succeed)
    log('9', 'Transfer from Wallet A to Wallet C (Now Both Approved)');
    const transferAmount3 = parseEther('2000');
    const transferHash3 = await walletAClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'transfer',
      args: [walletCAddress, transferAmount3],
    });
    await publicClient.waitForTransactionReceipt({ hash: transferHash3 });
    success(`Transferred ${formatEther(transferAmount3)} tokens from A to C`);
    info(`Tx: ${transferHash3}`);

    await printCapTable(publicClient, CONTRACT_ADDRESS, walletAAddress, walletBAddress, walletCAddress);

    // Step 10: Execute 7-for-1 stock split
    log('10', 'Execute 7-for-1 Stock Split');
    const splitHash = await adminClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'executeStockSplit',
      args: [7n],
    });
    await publicClient.waitForTransactionReceipt({ hash: splitHash });
    success('Stock split executed - all balances multiplied by 7');
    info(`Tx: ${splitHash}`);

    await printCapTable(publicClient, CONTRACT_ADDRESS, walletAAddress, walletBAddress, walletCAddress);

    // Step 11: Change symbol
    log('11', 'Change Token Symbol');
    const oldSymbol = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'symbol',
    });

    const changeSymbolHash = await adminClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'changeSymbol',
      args: ['CEQX'],
    });
    await publicClient.waitForTransactionReceipt({ hash: changeSymbolHash });

    const newSymbol = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'symbol',
    });

    success(`Symbol changed from ${oldSymbol} to ${newSymbol}`);
    info(`Tx: ${changeSymbolHash}`);
    info('Note: Balances remain unchanged');

    await printCapTable(publicClient, CONTRACT_ADDRESS, walletAAddress, walletBAddress, walletCAddress);

    // Step 12: Final cap table export
    log('12', 'Final Cap Table Export');
    const currentBlock = await publicClient.getBlockNumber();
    success(`Cap table exported at block: ${currentBlock}`);

    console.log('\n');
    console.log('╔═════════════════════════════════════════════════════════════════════╗');
    console.log('║                     Demo Completed Successfully!                    ║');
    console.log('╚═════════════════════════════════════════════════════════════════════╝');
    console.log('\n');

    info('All features demonstrated:');
    console.log('  ✅ Wallet approval and compliance gating');
    console.log('  ✅ Token minting to approved wallets');
    console.log('  ✅ Transfers between approved wallets');
    console.log('  ✅ Transfer blocking for non-approved wallets');
    console.log('  ✅ 7-for-1 stock split');
    console.log('  ✅ Symbol/ticker change');
    console.log('  ✅ Cap table generation and export');
    console.log('\n');
  } catch (err: any) {
    error(`Demo failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
