import { Router, Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain';
import { MintRequest, TransferRequest, ApiResponse } from '../types';

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

  // POST /api/tokens/transfer - Transfer tokens between addresses
  router.post('/transfer', async (req: Request, res: Response) => {
    try {
      const { from, to, amount } = req.body as TransferRequest;

      // Validate required fields
      if (!from || !to || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Fields "from", "to", and "amount" are all required'
        } as ApiResponse);
      }

      // Validate address formats
      if (!/^0x[a-fA-F0-9]{40}$/.test(from)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid "from" address format'
        } as ApiResponse);
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid "to" address format'
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

      // Check that both addresses are allowlisted
      console.log(`API: Checking allowlist status for ${from} and ${to}`);
      const [fromAllowlisted, toAllowlisted] = await Promise.all([
        blockchainService.checkAllowlistStatus(from),
        blockchainService.checkAllowlistStatus(to)
      ]);

      if (!fromAllowlisted) {
        return res.status(403).json({
          success: false,
          error: `Sender address ${from} is not on the allowlist`
        } as ApiResponse);
      }

      if (!toAllowlisted) {
        return res.status(403).json({
          success: false,
          error: `Recipient address ${to} is not on the allowlist`
        } as ApiResponse);
      }

      // Check sender has sufficient balance
      // Note: In this relayer model, we check the relayer's balance since transfer() uses msg.sender
      console.log(`API: Checking relayer balance...`);
      const relayerAddress = blockchainService.getRelayerAddress();
      const relayerBalance = await blockchainService.getBalance(relayerAddress);
      const relayerBalanceNum = parseFloat(relayerBalance);

      if (relayerBalanceNum < amountNum) {
        return res.status(400).json({
          success: false,
          error: `Insufficient relayer balance. Relayer has ${relayerBalance} tokens, but ${amount} tokens are required for transfer`
        } as ApiResponse);
      }

      console.log(`API: Transferring ${amount} tokens from ${from} to ${to}`);
      const txHash = await blockchainService.transferTokens(from, to, amount);

      res.json({
        success: true,
        data: {
          transactionHash: txHash,
          from,
          to,
          amount,
          message: 'Tokens transferred successfully'
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error transferring tokens:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to transfer tokens'
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
