import { Router, Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain';
import { MintRequest, ApiResponse } from '../types';

export const createTokensRouter = (blockchainService: BlockchainService) => {
  const router = Router();

  // POST /api/tokens/mint - Mint tokens to an address
  router.post('/mint', async (req: Request, res: Response) => {
    try {
      const { to, amount } = req.body as MintRequest;

      if (!to || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Both "to" address and "amount" are required'
        } as ApiResponse);
      }

      // Validate address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Ethereum address format'
        } as ApiResponse);
      }

      // Validate amount
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount. Must be a positive number'
        } as ApiResponse);
      }

      console.log(`API: Minting ${amount} tokens to ${to}`);
      const txHash = await blockchainService.mintTokens(to, amount);

      res.json({
        success: true,
        data: {
          transactionHash: txHash,
          to,
          amount,
          message: 'Tokens minted successfully'
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error minting tokens:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to mint tokens'
      } as ApiResponse);
    }
  });

  // GET /api/tokens/info - Get token information
  router.get('/info', async (req: Request, res: Response) => {
    try {
      const info = await blockchainService.getTokenInfo();

      res.json({
        success: true,
        data: info
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error getting token info:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get token info'
      } as ApiResponse);
    }
  });

  return router;
};
