import { Router, Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain';
import { RelayerSubmitRequest, ApiResponse } from '../types';

export const createRelayerRouter = (blockchainService: BlockchainService) => {
  const router = Router();

  // POST /api/relayer/submit - Submit a pre-signed transaction
  router.post('/submit', async (req: Request, res: Response) => {
    try {
      const { signedTransaction } = req.body as RelayerSubmitRequest;

      if (!signedTransaction) {
        return res.status(400).json({
          success: false,
          error: 'Signed transaction is required'
        } as ApiResponse);
      }

      // Validate transaction format (should start with 0x)
      if (!signedTransaction.startsWith('0x')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid transaction format. Must start with 0x'
        } as ApiResponse);
      }

      console.log('API: Submitting pre-signed transaction');
      const txHash = await blockchainService.submitSignedTransaction(signedTransaction as any);

      res.json({
        success: true,
        data: {
          transactionHash: txHash,
          message: 'Transaction submitted successfully'
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error submitting transaction:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit transaction'
      } as ApiResponse);
    }
  });

  // GET /api/relayer/address - Get relayer address
  router.get('/address', (req: Request, res: Response) => {
    try {
      const address = blockchainService.getRelayerAddress();

      res.json({
        success: true,
        data: {
          relayerAddress: address,
          message: 'This address is used to sign and submit transactions on behalf of users'
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error getting relayer address:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get relayer address'
      } as ApiResponse);
    }
  });

  return router;
};
