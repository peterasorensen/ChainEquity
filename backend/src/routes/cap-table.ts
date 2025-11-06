import { Router, Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain';
import { ApiResponse } from '../types';
import { formatEther } from 'viem';

export const createCapTableRouter = (blockchainService: BlockchainService) => {
  const router = Router();

  // GET /api/cap-table - Get cap table directly from blockchain
  router.get('/', async (req: Request, res: Response) => {
    try {
      console.log('API: Getting cap table from blockchain');

      const publicClient = blockchainService.getPublicClient();
      const contractAddress = blockchainService.getContractAddress();

      // Get current block to calculate range
      const currentBlock = await publicClient.getBlockNumber();
      const blockRange = 9999n; // Stay under 10k limit
      const fromBlock = currentBlock > blockRange ? currentBlock - blockRange : 0n;
      const toBlock = currentBlock; // Use specific block instead of "latest"

      // Fetch split multiplier and Transfer events in parallel
      const [splitMultiplier, logs] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: [{ type: 'function', name: 'splitMultiplier', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
          functionName: 'splitMultiplier'
        }),
        publicClient.getLogs({
          address: contractAddress,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { name: 'from', type: 'address', indexed: true },
              { name: 'to', type: 'address', indexed: true },
              { name: 'value', type: 'uint256', indexed: false }
            ]
          },
          fromBlock,
          toBlock
        })
      ]);

      // Calculate balances from events
      const balances = new Map<string, bigint>();
      const zeroAddress = '0x0000000000000000000000000000000000000000';

      for (const log of logs) {
        const from = (log.args.from as string).toLowerCase();
        const to = (log.args.to as string).toLowerCase();
        const value = log.args.value as bigint;

        // Deduct from sender (skip zero address = minting)
        if (from !== zeroAddress) {
          const fromBalance = balances.get(from) || BigInt(0);
          balances.set(from, fromBalance - value);
        }

        // Add to recipient
        const toBalance = balances.get(to) || BigInt(0);
        balances.set(to, toBalance + value);
      }

      // Apply split multiplier to all balances (rawBalance * multiplier / 1e18)
      const multiplier = splitMultiplier as bigint;
      for (const [address, rawBalance] of balances.entries()) {
        const adjustedBalance = (rawBalance * multiplier) / BigInt(1e18);
        balances.set(address, adjustedBalance);
      }

      // Remove zero balances and calculate total
      const entries: Array<{ address: string; balance: string; percentage: number }> = [];
      let totalSupply = BigInt(0);

      for (const [address, balance] of balances.entries()) {
        if (balance > 0) {
          entries.push({ address, balance: balance.toString(), percentage: 0 });
          totalSupply += balance;
        }
      }

      // Calculate percentages
      for (const entry of entries) {
        const balance = BigInt(entry.balance);
        entry.percentage = totalSupply > 0
          ? Number((balance * BigInt(10000)) / totalSupply) / 100
          : 0;
      }

      // Sort by balance descending
      entries.sort((a, b) => {
        const balA = BigInt(a.balance);
        const balB = BigInt(b.balance);
        return balA > balB ? -1 : balA < balB ? 1 : 0;
      });

      res.json({
        success: true,
        data: {
          totalShares: totalSupply.toString(),
          holders: entries.length,
          entries
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error getting cap table:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get cap table'
      } as ApiResponse);
    }
  });

  // GET /api/cap-table/export - Export cap table as CSV
  router.get('/export', async (req: Request, res: Response) => {
    try {
      const { blockNumber } = req.query as unknown as CapTableQuery;

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
      res.send(csv);
    } catch (error: any) {
      console.error('Error exporting cap table:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to export cap table'
      } as ApiResponse);
    }
  });

  return router;
};
