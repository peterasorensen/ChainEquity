import { Router, Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain';
import { ApiResponse } from '../types';
import { formatEther } from 'viem';

export const createCapTableRouter = (blockchainService: BlockchainService, dbQueries: any) => {
  const router = Router();

  // GET /api/cap-table - Get cap table using hybrid approach
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { blockNumber } = req.query as { blockNumber?: string };

      let blockNum: number | undefined;
      if (blockNumber !== undefined) {
        blockNum = parseInt(blockNumber.toString(), 10);
        if (isNaN(blockNum) || blockNum < 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid block number'
          } as ApiResponse);
        }
        console.log(`API: Getting historical cap table at block ${blockNum}`);
      } else {
        console.log('API: Getting current cap table from blockchain (hybrid approach)');
      }

      const publicClient = blockchainService.getPublicClient();
      const contractAddress = blockchainService.getContractAddress();

      let balanceResults: Array<{ address: string; balance: bigint }>;

      if (blockNum !== undefined) {
        // For historical queries, use database reconstruction with current multiplier
        console.log(`Reconstructing balances at block ${blockNum}`);
        const currentMultiplier = await blockchainService.getCurrentMultiplier();
        const historicalBalances = dbQueries.getCapTable(blockNum, currentMultiplier);
        balanceResults = historicalBalances.map((entry: any) => ({
          address: entry.address,
          balance: BigInt(entry.balance)
        }));
      } else {
        // Step 1: Get list of addresses that have ever held tokens from database
        // The event indexer tracks all addresses that have received transfers
        const dbBalances = dbQueries.getAllBalances();
        console.log(`Found ${dbBalances.length} addresses in database`);

        // Step 2: Query current balance from contract for each address
        // This gives us real-time truth from the blockchain
        const balancePromises = dbBalances.map(async (entry: any) => {
          try {
            const balance = await publicClient.readContract({
              address: contractAddress,
              abi: [{
                type: 'function',
                name: 'balanceOf',
                inputs: [{ type: 'address' }],
                outputs: [{ type: 'uint256' }],
                stateMutability: 'view'
              }],
              functionName: 'balanceOf',
              args: [entry.address as `0x${string}`]
            });
            return { address: entry.address, balance: balance as bigint };
          } catch (error) {
            console.error(`Error querying balance for ${entry.address}:`, error);
            return { address: entry.address, balance: BigInt(0) };
          }
        });

        balanceResults = await Promise.all(balancePromises);
      }

      // Step 3: Calculate total supply
      let totalSupply: bigint;

      if (blockNum !== undefined) {
        // For historical queries, calculate from reconstructed balances
        totalSupply = balanceResults.reduce((sum, result) => sum + result.balance, BigInt(0));
      } else {
        // Get total supply from contract (source of truth)
        const totalSupplyResult = await publicClient.readContract({
          address: contractAddress,
          abi: [{
            type: 'function',
            name: 'totalSupply',
            inputs: [],
            outputs: [{ type: 'uint256' }],
            stateMutability: 'view'
          }],
          functionName: 'totalSupply'
        });
        totalSupply = totalSupplyResult as bigint;
      }

      // Step 4: Build entries and calculate percentages
      const entries: Array<{ address: string; balance: string; percentage: number }> = [];

      for (const result of balanceResults) {
        if (result.balance > 0) {
          const percentage = totalSupply > 0
            ? Number((result.balance * BigInt(10000)) / totalSupply) / 100
            : 0;

          entries.push({
            address: result.address,
            balance: result.balance.toString(),
            percentage
          });
        }
      }

      // Sort by balance descending
      entries.sort((a, b) => {
        const balA = BigInt(a.balance);
        const balB = BigInt(b.balance);
        return balA > balB ? -1 : balA < balB ? 1 : 0;
      });

      console.log(`Cap table: ${entries.length} holders, total supply: ${formatEther(totalSupply)}`);

      return res.json({
        success: true,
        data: {
          totalShares: totalSupply.toString(),
          holders: entries.length,
          entries
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error getting cap table:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to get cap table'
      } as ApiResponse);
    }
  });

  // GET /api/cap-table/export - Export cap table as CSV
  router.get('/export', async (req: Request, res: Response) => {
    try {
      const { blockNumber } = req.query as { blockNumber?: string };

      let blockNum: number | undefined;
      if (blockNumber !== undefined) {
        blockNum = parseInt(blockNumber.toString(), 10);
        if (isNaN(blockNum) || blockNum < 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid block number'
          } as ApiResponse);
        }
      }

      const capTable = dbQueries.getCapTable(blockNum);

      // Generate CSV
      let csv = 'Address,Balance,Ownership %\n';
      for (const entry of capTable) {
        csv += `${entry.address},${entry.balance},${entry.percentage.toFixed(2)}\n`;
      }

      // Set headers for file download
      const filename = blockNum !== undefined
        ? `cap-table-block-${blockNum}.csv`
        : `cap-table-current.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csv);
    } catch (error: any) {
      console.error('Error exporting cap table:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to export cap table'
      } as ApiResponse);
    }
  });

  return router;
};
