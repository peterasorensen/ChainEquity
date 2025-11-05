import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  PublicClient,
  WalletClient,
  Address,
  Hash
} from 'viem';
import { polygonAmoy } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAIN_EQUITY_ABI } from '../utils/contract-abi';

export class BlockchainService {
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private account: ReturnType<typeof privateKeyToAccount>;
  private contractAddress: Address;

  constructor(
    rpcUrl: string,
    relayerPrivateKey: string,
    contractAddress: string
  ) {
    // Validate inputs
    if (!rpcUrl) {
      throw new Error('RPC URL is required');
    }
    if (!relayerPrivateKey) {
      throw new Error('Relayer private key is required');
    }
    if (!contractAddress) {
      throw new Error('Contract address is required');
    }

    // Create account from private key
    this.account = privateKeyToAccount(relayerPrivateKey as `0x${string}`);

    // Create public client for reading blockchain state
    this.publicClient = createPublicClient({
      chain: polygonAmoy,
      transport: http(rpcUrl)
    });

    // Create wallet client for signing and sending transactions
    this.walletClient = createWalletClient({
      account: this.account,
      chain: polygonAmoy,
      transport: http(rpcUrl)
    });

    this.contractAddress = contractAddress as Address;

    console.log(`Blockchain service initialized with relayer: ${this.account.address}`);
  }

  // Get the relayer address
  getRelayerAddress(): string {
    return this.account.address;
  }

  // Get public client for reading state
  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  // Get contract address
  getContractAddress(): Address {
    return this.contractAddress;
  }

  // Allowlist management
  async addToAllowlist(address: string): Promise<Hash> {
    console.log(`Adding ${address} to allowlist...`);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CHAIN_EQUITY_ABI,
        functionName: 'addToAllowlist',
        args: [address as Address],
        account: this.account
      });

      const hash = await this.walletClient.writeContract(request);
      console.log(`Transaction sent: ${hash}`);

      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return hash;
    } catch (error: any) {
      console.error('Error adding to allowlist:', error);
      throw new Error(`Failed to add to allowlist: ${error.message}`);
    }
  }

  async removeFromAllowlist(address: string): Promise<Hash> {
    console.log(`Removing ${address} from allowlist...`);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CHAIN_EQUITY_ABI,
        functionName: 'removeFromAllowlist',
        args: [address as Address],
        account: this.account
      });

      const hash = await this.walletClient.writeContract(request);
      console.log(`Transaction sent: ${hash}`);

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return hash;
    } catch (error: any) {
      console.error('Error removing from allowlist:', error);
      throw new Error(`Failed to remove from allowlist: ${error.message}`);
    }
  }

  async checkAllowlistStatus(address: string): Promise<boolean> {
    try {
      const isAllowlisted = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CHAIN_EQUITY_ABI,
        functionName: 'isAllowlisted',
        args: [address as Address]
      });

      return isAllowlisted as boolean;
    } catch (error: any) {
      console.error('Error checking allowlist status:', error);
      throw new Error(`Failed to check allowlist status: ${error.message}`);
    }
  }

  // Token operations
  async mintTokens(to: string, amount: string): Promise<Hash> {
    console.log(`Minting ${amount} tokens to ${to}...`);

    try {
      // Convert amount to wei (assuming 18 decimals)
      const amountWei = parseEther(amount);

      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CHAIN_EQUITY_ABI,
        functionName: 'mint',
        args: [to as Address, amountWei],
        account: this.account
      });

      const hash = await this.walletClient.writeContract(request);
      console.log(`Transaction sent: ${hash}`);

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return hash;
    } catch (error: any) {
      console.error('Error minting tokens:', error);
      throw new Error(`Failed to mint tokens: ${error.message}`);
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CHAIN_EQUITY_ABI,
        functionName: 'balanceOf',
        args: [address as Address]
      });

      return formatEther(balance as bigint);
    } catch (error: any) {
      console.error('Error getting balance:', error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async getTotalSupply(): Promise<string> {
    try {
      const totalSupply = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CHAIN_EQUITY_ABI,
        functionName: 'totalSupply'
      });

      return formatEther(totalSupply as bigint);
    } catch (error: any) {
      console.error('Error getting total supply:', error);
      throw new Error(`Failed to get total supply: ${error.message}`);
    }
  }

  async getTokenInfo(): Promise<{ name: string; symbol: string; totalSupply: string }> {
    try {
      const [name, symbol, totalSupply] = await Promise.all([
        this.publicClient.readContract({
          address: this.contractAddress,
          abi: CHAIN_EQUITY_ABI,
          functionName: 'name'
        }),
        this.publicClient.readContract({
          address: this.contractAddress,
          abi: CHAIN_EQUITY_ABI,
          functionName: 'symbol'
        }),
        this.publicClient.readContract({
          address: this.contractAddress,
          abi: CHAIN_EQUITY_ABI,
          functionName: 'totalSupply'
        })
      ]);

      return {
        name: name as string,
        symbol: symbol as string,
        totalSupply: formatEther(totalSupply as bigint)
      };
    } catch (error: any) {
      console.error('Error getting token info:', error);
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }

  // Corporate actions
  async executeStockSplit(multiplier: number): Promise<Hash> {
    console.log(`Executing stock split with multiplier: ${multiplier}...`);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CHAIN_EQUITY_ABI,
        functionName: 'executeStockSplit',
        args: [BigInt(multiplier)],
        account: this.account
      });

      const hash = await this.walletClient.writeContract(request);
      console.log(`Transaction sent: ${hash}`);

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return hash;
    } catch (error: any) {
      console.error('Error executing stock split:', error);
      throw new Error(`Failed to execute stock split: ${error.message}`);
    }
  }

  async changeSymbol(newName: string, newSymbol: string): Promise<Hash> {
    console.log(`Changing symbol to ${newSymbol} (${newName})...`);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CHAIN_EQUITY_ABI,
        functionName: 'changeSymbol',
        args: [newName, newSymbol],
        account: this.account
      });

      const hash = await this.walletClient.writeContract(request);
      console.log(`Transaction sent: ${hash}`);

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return hash;
    } catch (error: any) {
      console.error('Error changing symbol:', error);
      throw new Error(`Failed to change symbol: ${error.message}`);
    }
  }

  // Get current block number
  async getCurrentBlockNumber(): Promise<bigint> {
    return await this.publicClient.getBlockNumber();
  }

  // Submit a pre-signed transaction (for user-signed transactions)
  async submitSignedTransaction(signedTransaction: Hash): Promise<Hash> {
    console.log('Submitting signed transaction...');

    try {
      const hash = await this.walletClient.sendRawTransaction({
        serializedTransaction: signedTransaction
      });

      console.log(`Transaction sent: ${hash}`);

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return hash;
    } catch (error: any) {
      console.error('Error submitting signed transaction:', error);
      throw new Error(`Failed to submit transaction: ${error.message}`);
    }
  }
}
