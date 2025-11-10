import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from './db/init';
import { DatabaseQueries } from './db/queries';
import { BlockchainService } from './services/blockchain';
import { EventIndexer } from './services/indexer';
import { createWalletsRouter } from './routes/wallets';
import { createTokensRouter } from './routes/tokens';
import { createCorporateActionsRouter } from './routes/corporate-actions';
import { createCapTableRouter } from './routes/cap-table';
import { createAllowlistRouter } from './routes/allowlist';
import { createRelayerRouter } from './routes/relayer';

// Load environment variables
dotenv.config({ path: '../.env' });

// Validate required environment variables
const requiredEnvVars = [
  'POLYGON_RPC_URL',
  'RELAYER_PRIVATE_KEY',
  'CONTRACT_ADDRESS'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in environment variables`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3001;
const RPC_URL = process.env.POLYGON_RPC_URL!;
const RELAYER_KEY = process.env.RELAYER_PRIVATE_KEY!;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Initialize services
let blockchainService: BlockchainService;
let dbQueries: DatabaseQueries;
let indexer: EventIndexer;

const initializeServices = async () => {
  try {
    console.log('Initializing ChainEquity backend services...');

    // Initialize database
    const db = initializeDatabase();
    dbQueries = new DatabaseQueries(db);
    console.log('Database initialized');

    // Initialize blockchain service
    blockchainService = new BlockchainService(RPC_URL, RELAYER_KEY, CONTRACT_ADDRESS);
    console.log('Blockchain service initialized');

    // Get token info
    const tokenInfo = await blockchainService.getTokenInfo();
    console.log(`Connected to token: ${tokenInfo.name} (${tokenInfo.symbol})`);
    console.log(`Total supply: ${tokenInfo.totalSupply}`);
    console.log(`Contract address: ${CONTRACT_ADDRESS}`);

    // Initialize event indexer
    indexer = new EventIndexer(blockchainService, dbQueries);
    await indexer.start();
    console.log('Event indexer started');

    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
};

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const indexerStatus = indexer.getStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      blockchain: 'connected',
      indexer: indexerStatus.running ? 'running' : 'stopped',
      lastIndexedBlock: indexerStatus.lastIndexedBlock
    }
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'ChainEquity Backend API',
    version: '1.0.0',
    description: 'Relayer service and event indexer for tokenized securities',
    endpoints: {
      health: 'GET /health',
      wallets: {
        approve: 'POST /api/wallets/approve',
        revoke: 'POST /api/wallets/revoke'
      },
      tokens: {
        mint: 'POST /api/tokens/mint',
        info: 'GET /api/tokens/info'
      },
      corporateActions: {
        split: 'POST /api/corporate-actions/split',
        rename: 'POST /api/corporate-actions/rename'
      },
      capTable: {
        get: 'GET /api/cap-table',
        export: 'GET /api/cap-table/export'
      },
      allowlist: {
        check: 'GET /api/allowlist/:address',
        list: 'GET /api/allowlist'
      },
      relayer: {
        submit: 'POST /api/relayer/submit',
        address: 'GET /api/relayer/address'
      }
    }
  });
});

// Mount API routes (will be initialized after services are ready)
const mountRoutes = () => {
  app.use('/api/wallets', createWalletsRouter(blockchainService));
  app.use('/api/tokens', createTokensRouter(blockchainService));
  app.use('/api/corporate-actions', createCorporateActionsRouter(blockchainService));
  app.use('/api/cap-table', createCapTableRouter(blockchainService, dbQueries));
  app.use('/api/allowlist', createAllowlistRouter(blockchainService, dbQueries));
  app.use('/api/relayer', createRelayerRouter(blockchainService));
  console.log('API routes mounted');

  // Error handling middleware (must be after routes)
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });

  // 404 handler (must be last)
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });
  });
};

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down gracefully...');

  if (indexer) {
    indexer.stop();
  }

  closeDatabase();

  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
const startServer = async () => {
  try {
    await initializeServices();
    mountRoutes();

    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`ChainEquity Backend Server`);
      console.log(`${'='.repeat(60)}`);
      console.log(`Server running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Contract: ${CONTRACT_ADDRESS}`);
      console.log(`Network: Polygon Amoy Testnet`);
      console.log(`${'='.repeat(60)}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
