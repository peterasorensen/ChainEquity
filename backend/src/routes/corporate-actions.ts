import { Router, Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain';
import { StockSplitRequest, SymbolChangeRequest, ApiResponse } from '../types';

export const createCorporateActionsRouter = (blockchainService: BlockchainService) => {
  const router = Router();

  // POST /api/corporate-actions/split - Execute stock split
  router.post('/split', async (req: Request, res: Response) => {
    try {
      const { multiplier } = req.body as StockSplitRequest;

      if (!multiplier) {
        return res.status(400).json({
          success: false,
          error: 'Multiplier is required'
        } as ApiResponse);
      }

      // Validate multiplier
      if (typeof multiplier !== 'number' || multiplier <= 1 || !Number.isInteger(multiplier)) {
        return res.status(400).json({
          success: false,
          error: 'Multiplier must be an integer greater than 1'
        } as ApiResponse);
      }

      console.log(`API: Executing stock split with multiplier ${multiplier}`);
      const txHash = await blockchainService.executeStockSplit(multiplier);

      res.json({
        success: true,
        data: {
          transactionHash: txHash,
          multiplier,
          message: `Stock split (${multiplier}-for-1) executed successfully`
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error executing stock split:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to execute stock split'
      } as ApiResponse);
    }
  });

  // POST /api/corporate-actions/rename - Change token name/symbol
  router.post('/rename', async (req: Request, res: Response) => {
    try {
      const { newName, newSymbol } = req.body as SymbolChangeRequest;

      if (!newName || !newSymbol) {
        return res.status(400).json({
          success: false,
          error: 'Both newName and newSymbol are required'
        } as ApiResponse);
      }

      // Validate name and symbol
      if (newName.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'New name cannot be empty'
        } as ApiResponse);
      }

      if (newSymbol.trim().length === 0 || newSymbol.length > 11) {
        return res.status(400).json({
          success: false,
          error: 'New symbol must be between 1 and 11 characters'
        } as ApiResponse);
      }

      console.log(`API: Changing token symbol to ${newSymbol} (${newName})`);
      const txHash = await blockchainService.changeSymbol(newName, newSymbol);

      res.json({
        success: true,
        data: {
          transactionHash: txHash,
          newName,
          newSymbol,
          message: 'Token name and symbol changed successfully'
        }
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error changing symbol:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to change symbol'
      } as ApiResponse);
    }
  });

  return router;
};
