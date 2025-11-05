import { Router, Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain';
import { DatabaseQueries } from '../db/queries';
import { ApiResponse } from '../types';

export const createAllowlistRouter = (
  blockchainService: BlockchainService,
  dbQueries: DatabaseQueries
) => {
  const router = Router();

  // GET /api/allowlist/:address - Check allowlist status for an address
  router.get('/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      // Validate address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Ethereum address format'
        } as ApiResponse);
      }

      console.log(`API: Checking allowlist status for ${address}`);

      // Get status from database (indexed data)
      const dbStatus = dbQueries.getAllowlistStatus(address);

      // Also verify against blockchain for consistency
      const blockchainStatus = await blockchainService.checkAllowlistStatus(address);

      res.json({
        success: true,
        data: {
          address,
          approved: blockchainStatus,
          lastUpdated: dbStatus?.timestamp,
          source: {
            blockchain: blockchainStatus,
            database: dbStatus?.approved ?? false
          }
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error checking allowlist status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to check allowlist status'
      } as ApiResponse);
    }
  });

  // GET /api/allowlist - Get all allowlisted addresses
  router.get('/', async (req: Request, res: Response) => {
    try {
      console.log('API: Getting all allowlisted addresses');

      const allowlisted = dbQueries.getAllAllowlisted();

      res.json({
        success: true,
        data: {
          count: allowlisted.length,
          addresses: allowlisted
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error getting allowlist:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get allowlist'
      } as ApiResponse);
    }
  });

  return router;
};
