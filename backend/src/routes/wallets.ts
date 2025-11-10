import { Router, Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain';
import { AllowlistRequest, ApiResponse } from '../types';

export const createWalletsRouter = (blockchainService: BlockchainService) => {
  const router = Router();

  // POST /api/wallets/approve - Add wallet to allowlist
  router.post('/approve', async (req: Request, res: Response) => {
    try {
      const { address } = req.body as AllowlistRequest;

      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Address is required'
        } as ApiResponse);
      }

      // Validate address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Ethereum address format'
        } as ApiResponse);
      }

      console.log(`API: Approving wallet ${address}`);
      const txHash = await blockchainService.addToAllowlist(address);

      return res.json({
        success: true,
        data: {
          transactionHash: txHash,
          address,
          message: 'Wallet approved successfully'
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error approving wallet:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to approve wallet'
      } as ApiResponse);
    }
  });

  // POST /api/wallets/revoke - Remove wallet from allowlist
  router.post('/revoke', async (req: Request, res: Response) => {
    try {
      const { address } = req.body as AllowlistRequest;

      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Address is required'
        } as ApiResponse);
      }

      // Validate address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Ethereum address format'
        } as ApiResponse);
      }

      console.log(`API: Revoking wallet ${address}`);
      const txHash = await blockchainService.removeFromAllowlist(address);

      return res.json({
        success: true,
        data: {
          transactionHash: txHash,
          address,
          message: 'Wallet approval revoked successfully'
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error revoking wallet:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to revoke wallet'
      } as ApiResponse);
    }
  });

  return router;
};
