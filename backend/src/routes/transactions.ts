import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types';

export interface TransactionEntry {
  hash: string;
  from_addr: string;
  to_addr: string;
  amount: string;
  block_number: number;
  timestamp: number;
}

export interface TransactionEntryWithMultiplier extends TransactionEntry {
  adjustedAmount: string;
  multiplier: string;
}

export const createTransactionsRouter = (dbQueries: any) => {
  const router = Router();

  // GET /api/transactions - Get recent transactions
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { limit = '50', offset = '0' } = req.query as { limit?: string; offset?: string };

      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be a number between 1 and 1000'
        } as ApiResponse);
      }

      if (isNaN(offsetNum) || offsetNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'Offset must be a non-negative number'
        } as ApiResponse);
      }

      // Get all transactions from database, sorted by timestamp descending
      const allTransactions = dbQueries.getAllTransactions();

      // Apply pagination
      const total = allTransactions.length;
      const paginatedTransactions = allTransactions
        .sort((a: TransactionEntry, b: TransactionEntry) => b.timestamp - a.timestamp)
        .slice(offsetNum, offsetNum + limitNum);

      // Apply multiplier adjustments to each transaction
      const adjustedTransactions: TransactionEntryWithMultiplier[] = paginatedTransactions.map((tx: TransactionEntry) => {
        // Get the cumulative multiplier from splits that occurred after this transaction
        const multiplier = dbQueries.getCumulativeMultiplierAfterBlock(tx.block_number);
        const originalAmount = BigInt(tx.amount);
        const adjustedAmount = originalAmount * multiplier;

        // Log for debugging
        if (multiplier > BigInt(1)) {
          console.log(`Transaction at block ${tx.block_number}: multiplier=${multiplier}, original=${originalAmount}, adjusted=${adjustedAmount}`);
        }

        return {
          ...tx,
          adjustedAmount: adjustedAmount.toString(),
          multiplier: multiplier.toString()
        };
      });

      console.log(`Returning ${adjustedTransactions.length} transactions (total: ${total})`);

      return res.json({
        success: true,
        data: {
          transactions: adjustedTransactions,
          total,
          limit: limitNum,
          offset: offsetNum
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error getting transactions:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to get transactions'
      } as ApiResponse);
    }
  });

  // GET /api/transactions/:address - Get transactions for a specific address
  router.get('/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const { limit = '50', offset = '0' } = req.query as { limit?: string; offset?: string };

      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be a number between 1 and 1000'
        } as ApiResponse);
      }

      if (isNaN(offsetNum) || offsetNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'Offset must be a non-negative number'
        } as ApiResponse);
      }

      if (!address || !address.startsWith('0x') || address.length !== 42) {
        return res.status(400).json({
          success: false,
          error: 'Invalid address format'
        } as ApiResponse);
      }

      const transactions = dbQueries.getTransactionsByAddress(address.toLowerCase());

      // Apply pagination
      const total = transactions.length;
      const paginatedTransactions = transactions
        .sort((a: TransactionEntry, b: TransactionEntry) => b.timestamp - a.timestamp)
        .slice(offsetNum, offsetNum + limitNum);

      // Apply multiplier adjustments to each transaction
      const adjustedTransactions: TransactionEntryWithMultiplier[] = paginatedTransactions.map((tx: TransactionEntry) => {
        // Get the cumulative multiplier from splits that occurred after this transaction
        const multiplier = dbQueries.getCumulativeMultiplierAfterBlock(tx.block_number);
        const originalAmount = BigInt(tx.amount);
        const adjustedAmount = originalAmount * multiplier;

        // Log for debugging
        if (multiplier > BigInt(1)) {
          console.log(`Transaction at block ${tx.block_number}: multiplier=${multiplier}, original=${originalAmount}, adjusted=${adjustedAmount}`);
        }

        return {
          ...tx,
          adjustedAmount: adjustedAmount.toString(),
          multiplier: multiplier.toString()
        };
      });

      console.log(`Returning ${adjustedTransactions.length} transactions for address ${address} (total: ${total})`);

      return res.json({
        success: true,
        data: {
          transactions: adjustedTransactions,
          total,
          limit: limitNum,
          offset: offsetNum,
          address
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error getting transactions for address:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to get transactions for address'
      } as ApiResponse);
    }
  });

  return router;
};
