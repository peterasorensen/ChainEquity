#!/usr/bin/env ts-node
/**
 * Health Check Script
 *
 * Verifies all components of ChainEquity are running correctly:
 * - Contracts deployed
 * - Backend API responding
 * - Frontend can connect
 * - Indexer is running
 * - Database has data
 *
 * Exit codes:
 * 0 - All checks passed
 * 1 - One or more checks failed
 *
 * Usage:
 *   npm run health-check
 */

import { createPublicClient, http, type Address } from 'viem';
import { foundry } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';

interface HealthCheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: string;
}

// Configuration
const RPC_URL = process.env.ANVIL_RPC_URL || process.env.POLYGON_RPC_URL || 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS as Address | undefined;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Minimal ABI for health checks
const TOKEN_ABI = [
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// Helper functions
function log(message: string) {
  console.log(message);
}

function success(message: string) {
  console.log(`✅ ${message}`);
}

function error(message: string) {
  console.log(`❌ ${message}`);
}

function warn(message: string) {
  console.log(`⚠️  ${message}`);
}

async function checkRpcConnection(): Promise<HealthCheckResult> {
  try {
    const publicClient = createPublicClient({
      chain: foundry,
      transport: http(RPC_URL),
    });

    const blockNumber = await publicClient.getBlockNumber();

    return {
      name: 'RPC Connection',
      status: 'PASS',
      message: 'RPC endpoint is accessible',
      details: `Current block: ${blockNumber}`,
    };
  } catch (err: any) {
    return {
      name: 'RPC Connection',
      status: 'FAIL',
      message: 'Cannot connect to RPC endpoint',
      details: err.message,
    };
  }
}

async function checkContractDeployment(): Promise<HealthCheckResult> {
  if (!CONTRACT_ADDRESS) {
    return {
      name: 'Contract Deployment',
      status: 'WARN',
      message: 'CONTRACT_ADDRESS not set in environment',
      details: 'Deploy contract or set CONTRACT_ADDRESS in .env',
    };
  }

  try {
    const publicClient = createPublicClient({
      chain: foundry,
      transport: http(RPC_URL),
    });

    const code = await publicClient.getBytecode({
      address: CONTRACT_ADDRESS,
    });

    if (!code || code === '0x') {
      return {
        name: 'Contract Deployment',
        status: 'FAIL',
        message: 'No contract code at specified address',
        details: `Address: ${CONTRACT_ADDRESS}`,
      };
    }

    // Try to read contract data
    const name = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'name',
    });

    return {
      name: 'Contract Deployment',
      status: 'PASS',
      message: 'Contract deployed and responding',
      details: `Token: ${name} at ${CONTRACT_ADDRESS}`,
    };
  } catch (err: any) {
    return {
      name: 'Contract Deployment',
      status: 'FAIL',
      message: 'Contract deployed but not responding correctly',
      details: err.message,
    };
  }
}

async function checkBackendApi(): Promise<HealthCheckResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        name: 'Backend API',
        status: 'PASS',
        message: 'Backend API is running',
        details: `Status: ${data.status || 'healthy'}`,
      };
    } else {
      return {
        name: 'Backend API',
        status: 'WARN',
        message: 'Backend API returned non-200 status',
        details: `Status: ${response.status}`,
      };
    }
  } catch (err: any) {
    if (err.name === 'AbortError' || err.code === 'ECONNREFUSED') {
      return {
        name: 'Backend API',
        status: 'WARN',
        message: 'Backend API not running',
        details: 'Start with: npm run dev:backend',
      };
    }

    return {
      name: 'Backend API',
      status: 'WARN',
      message: 'Cannot connect to backend API',
      details: err.message,
    };
  }
}

async function checkFrontend(): Promise<HealthCheckResult> {
  try {
    const response = await fetch(FRONTEND_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return {
        name: 'Frontend',
        status: 'PASS',
        message: 'Frontend is running',
        details: `Available at ${FRONTEND_URL}`,
      };
    } else {
      return {
        name: 'Frontend',
        status: 'WARN',
        message: 'Frontend returned non-200 status',
        details: `Status: ${response.status}`,
      };
    }
  } catch (err: any) {
    if (err.name === 'AbortError' || err.code === 'ECONNREFUSED') {
      return {
        name: 'Frontend',
        status: 'WARN',
        message: 'Frontend not running',
        details: 'Start with: npm run dev:frontend',
      };
    }

    return {
      name: 'Frontend',
      status: 'WARN',
      message: 'Cannot connect to frontend',
      details: err.message,
    };
  }
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const dbPath = path.join(__dirname, '..', 'backend', 'indexer.db');

  if (!fs.existsSync(dbPath)) {
    return {
      name: 'Database',
      status: 'WARN',
      message: 'Database file not found',
      details: 'Will be created when indexer starts',
    };
  }

  try {
    const stats = fs.statSync(dbPath);

    return {
      name: 'Database',
      status: 'PASS',
      message: 'Database exists',
      details: `Size: ${(stats.size / 1024).toFixed(2)} KB`,
    };
  } catch (err: any) {
    return {
      name: 'Database',
      status: 'FAIL',
      message: 'Cannot access database',
      details: err.message,
    };
  }
}

async function checkIndexer(): Promise<HealthCheckResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/cap-table`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        return {
          name: 'Indexer',
          status: 'PASS',
          message: 'Indexer has indexed data',
          details: `Cap table has ${data.length} entries`,
        };
      } else {
        return {
          name: 'Indexer',
          status: 'WARN',
          message: 'Indexer running but no data indexed yet',
          details: 'Perform some transactions to populate',
        };
      }
    } else {
      return {
        name: 'Indexer',
        status: 'WARN',
        message: 'Cannot query indexer',
        details: `Status: ${response.status}`,
      };
    }
  } catch (err: any) {
    return {
      name: 'Indexer',
      status: 'WARN',
      message: 'Indexer not accessible',
      details: 'Backend may not be running',
    };
  }
}

async function checkEnvironment(): Promise<HealthCheckResult> {
  const requiredVars = ['POLYGON_RPC_URL', 'PRIVATE_KEY'];
  const missingVars = requiredVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    return {
      name: 'Environment',
      status: 'WARN',
      message: 'Some environment variables not set',
      details: `Missing: ${missingVars.join(', ')}`,
    };
  }

  return {
    name: 'Environment',
    status: 'PASS',
    message: 'All required environment variables set',
  };
}

async function checkProjectStructure(): Promise<HealthCheckResult> {
  const requiredDirs = ['contracts', 'backend', 'frontend', 'shared', 'tests', 'scripts'];
  const missingDirs = requiredDirs.filter((dir) => {
    const dirPath = path.join(__dirname, '..', dir);
    return !fs.existsSync(dirPath);
  });

  if (missingDirs.length > 0) {
    return {
      name: 'Project Structure',
      status: 'WARN',
      message: 'Some directories missing',
      details: `Missing: ${missingDirs.join(', ')}`,
    };
  }

  return {
    name: 'Project Structure',
    status: 'PASS',
    message: 'All required directories present',
  };
}

function printResults(results: HealthCheckResult[]) {
  console.log('\n╔═════════════════════════════════════════════════════════════════════╗');
  console.log('║                    ChainEquity Health Check                         ║');
  console.log('╚═════════════════════════════════════════════════════════════════════╝\n');

  console.log('┌──────────────────────────┬────────┬─────────────────────────────────┐');
  console.log('│ Component                │ Status │ Details                         │');
  console.log('├──────────────────────────┼────────┼─────────────────────────────────┤');

  for (const result of results) {
    const statusEmoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    const statusText = result.status.padEnd(4);
    const details = result.details ? result.details.substring(0, 30) : result.message.substring(0, 30);

    console.log(
      `│ ${result.name.padEnd(24)} │ ${statusEmoji} ${statusText} │ ${details.padEnd(31)} │`
    );
  }

  console.log('└──────────────────────────┴────────┴─────────────────────────────────┘\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warned = results.filter((r) => r.status === 'WARN').length;

  console.log('Summary:');
  console.log(`  ✅ Passed: ${passed}/${results.length}`);
  console.log(`  ❌ Failed: ${failed}/${results.length}`);
  console.log(`  ⚠️  Warnings: ${warned}/${results.length}\n`);

  // Print detailed messages
  if (failed > 0 || warned > 0) {
    console.log('Details:\n');

    for (const result of results) {
      if (result.status === 'FAIL') {
        error(`${result.name}: ${result.message}`);
        if (result.details) {
          console.log(`  ${result.details}\n`);
        }
      } else if (result.status === 'WARN') {
        warn(`${result.name}: ${result.message}`);
        if (result.details) {
          console.log(`  ${result.details}\n`);
        }
      }
    }
  }
}

async function main() {
  const results: HealthCheckResult[] = [];

  log('Running health checks...\n');

  // Run all checks
  results.push(await checkProjectStructure());
  results.push(await checkEnvironment());
  results.push(await checkRpcConnection());
  results.push(await checkContractDeployment());
  results.push(await checkBackendApi());
  results.push(await checkFrontend());
  results.push(await checkDatabase());
  results.push(await checkIndexer());

  // Print results
  printResults(results);

  // Exit with appropriate code
  const failed = results.filter((r) => r.status === 'FAIL').length;

  if (failed > 0) {
    error('Health check failed - please fix the issues above\n');
    process.exit(1);
  } else {
    success('Health check passed - all critical components are operational\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Health check error:', err);
  process.exit(1);
});
