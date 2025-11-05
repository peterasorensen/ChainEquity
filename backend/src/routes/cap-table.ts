import { Router, Request, Response } from 'express';
import { DatabaseQueries } from '../db/queries';
import { ApiResponse, CapTableQuery } from '../types';

export const createCapTableRouter = (dbQueries: DatabaseQueries) => {
  const router = Router();

  // GET /api/cap-table - Get cap table (current or historical)
  router.get('/', async (req: Request, res: Response) => {
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

      console.log(
        blockNum !== undefined
          ? `API: Getting cap table at block ${blockNum}`
          : 'API: Getting current cap table'
      );

      const capTable = dbQueries.getCapTable(blockNum);

      // Calculate total
      const totalShares = capTable.reduce((sum, entry) => {
        return sum + BigInt(entry.balance);
      }, BigInt(0));

      res.json({
        success: true,
        data: {
          blockNumber: blockNum,
          totalShares: totalShares.toString(),
          holders: capTable.length,
          entries: capTable
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
