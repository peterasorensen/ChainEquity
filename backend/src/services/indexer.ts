import { BlockchainService } from './blockchain';
import { DatabaseQueries } from '../db/queries';
import { CHAIN_EQUITY_ABI } from '../utils/contract-abi';
import { parseAbiItem, Log, decodeEventLog } from 'viem';

export class EventIndexer {
  private isRunning = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 5000; // Poll every 5 seconds
  private readonly BLOCKS_PER_QUERY = 1000; // Query 1000 blocks at a time

  constructor(
    private blockchainService: BlockchainService,
    private dbQueries: DatabaseQueries
  ) {}

  // Start the indexer
  async start() {
    if (this.isRunning) {
      console.log('Indexer is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting event indexer...');

    // Get the starting block
    const lastIndexedBlock = this.dbQueries.getLastIndexedBlock();
    const currentBlock = await this.blockchainService.getCurrentBlockNumber();

    if (lastIndexedBlock === null) {
      console.log(`First run - starting from current block: ${currentBlock}`);
      this.dbQueries.updateLastIndexedBlock(Number(currentBlock));
    } else {
      console.log(`Resuming from block: ${lastIndexedBlock}`);
      // Catch up on missed blocks
      await this.indexHistoricalBlocks(lastIndexedBlock, Number(currentBlock));
    }

    // Start polling for new blocks
    this.pollInterval = setInterval(() => {
      this.pollNewBlocks().catch(error => {
        console.error('Error polling new blocks:', error);
      });
    }, this.POLL_INTERVAL_MS);

    console.log('Event indexer started successfully');
  }

  // Stop the indexer
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    console.log('Event indexer stopped');
  }

  // Index historical blocks
  private async indexHistoricalBlocks(fromBlock: number, toBlock: number) {
    if (fromBlock >= toBlock) {
      return;
    }

    console.log(`Indexing historical blocks from ${fromBlock} to ${toBlock}...`);

    let currentFrom = fromBlock + 1;
    while (currentFrom < toBlock) {
      const currentTo = Math.min(currentFrom + this.BLOCKS_PER_QUERY, toBlock);

      await this.indexBlockRange(currentFrom, currentTo);

      currentFrom = currentTo + 1;
    }

    console.log(`Historical indexing complete`);
  }

  // Poll for new blocks
  private async pollNewBlocks() {
    const lastIndexedBlock = this.dbQueries.getLastIndexedBlock();
    if (lastIndexedBlock === null) return;

    const currentBlock = await this.blockchainService.getCurrentBlockNumber();
    const currentBlockNum = Number(currentBlock);

    if (currentBlockNum > lastIndexedBlock) {
      await this.indexBlockRange(lastIndexedBlock + 1, currentBlockNum);
    }
  }

  // Index a range of blocks
  private async indexBlockRange(fromBlock: number, toBlock: number) {
    console.log(`Indexing blocks ${fromBlock} to ${toBlock}...`);

    const publicClient = this.blockchainService.getPublicClient();
    const contractAddress = this.blockchainService.getContractAddress();

    try {
      // Fetch all events in this range
      const logs = await publicClient.getLogs({
        address: contractAddress,
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock)
      });

      // Process each log
      for (const log of logs) {
        await this.processLog(log);
      }

      // Update last indexed block
      this.dbQueries.updateLastIndexedBlock(toBlock);
      console.log(`Indexed ${logs.length} events up to block ${toBlock}`);
    } catch (error) {
      console.error(`Error indexing blocks ${fromBlock}-${toBlock}:`, error);
      throw error;
    }
  }

  // Process a single log entry
  private async processLog(log: Log) {
    try {
      // Try to decode the log with each event type
      for (const event of CHAIN_EQUITY_ABI) {
        if (event.type !== 'event') continue;

        try {
          const decoded = decodeEventLog({
            abi: [event],
            data: log.data,
            topics: log.topics
          });

          await this.handleEvent(decoded.eventName, decoded.args, log);
          return;
        } catch {
          // Try next event type
          continue;
        }
      }
    } catch (error) {
      console.error('Error processing log:', error);
    }
  }

  // Handle different event types
  private async handleEvent(eventName: string, args: any, log: Log) {
    const blockNumber = Number(log.blockNumber);
    const timestamp = Date.now(); // In production, we'd fetch block timestamp

    switch (eventName) {
      case 'Transfer':
        await this.handleTransfer(args, log, blockNumber, timestamp);
        break;

      case 'Mint':
        await this.handleMint(args, log, blockNumber, timestamp);
        break;

      case 'AllowlistUpdated':
        await this.handleAllowlistUpdate(args, blockNumber, timestamp);
        break;

      case 'StockSplit':
        await this.handleStockSplit(args, blockNumber, timestamp);
        break;

      case 'SymbolChanged':
        await this.handleSymbolChange(args, blockNumber, timestamp);
        break;

      default:
        console.log(`Unknown event: ${eventName}`);
    }
  }

  // Handle Transfer events
  private async handleTransfer(args: any, log: Log, blockNumber: number, timestamp: number) {
    const from = (args.from as string).toLowerCase();
    const to = (args.to as string).toLowerCase();
    const value = args.value as bigint;

    console.log(`Transfer: ${from} -> ${to}, amount: ${value.toString()}`);

    // Store transaction
    this.dbQueries.insertTransaction({
      hash: log.transactionHash!,
      from_addr: from,
      to_addr: to,
      amount: value.toString(),
      block_number: blockNumber,
      timestamp
    });

    // Update balances
    const zeroAddress = '0x0000000000000000000000000000000000000000';

    if (from !== zeroAddress) {
      // Deduct from sender
      const senderBalance = this.dbQueries.getBalance(from);
      const newSenderBalance = senderBalance
        ? BigInt(senderBalance.balance) - value
        : BigInt(0);
      this.dbQueries.upsertBalance(from, newSenderBalance.toString(), timestamp);
    }

    if (to !== zeroAddress) {
      // Add to recipient
      const recipientBalance = this.dbQueries.getBalance(to);
      const newRecipientBalance = recipientBalance
        ? BigInt(recipientBalance.balance) + value
        : value;
      this.dbQueries.upsertBalance(to, newRecipientBalance.toString(), timestamp);
    }
  }

  // Handle Mint events
  private async handleMint(args: any, log: Log, blockNumber: number, timestamp: number) {
    const to = (args.to as string).toLowerCase();
    const amount = args.amount as bigint;

    console.log(`Mint: ${to}, amount: ${amount.toString()}`);

    // Mint is also recorded as a transfer from zero address
    // So we don't need to duplicate the logic here, but we can log it
  }

  // Handle AllowlistUpdated events
  private async handleAllowlistUpdate(args: any, blockNumber: number, timestamp: number) {
    const account = (args.account as string).toLowerCase();
    const approved = args.approved as boolean;

    console.log(`AllowlistUpdate: ${account}, approved: ${approved}`);

    this.dbQueries.upsertAllowlist(account, approved, timestamp);
  }

  // Handle StockSplit events
  private async handleStockSplit(args: any, blockNumber: number, timestamp: number) {
    const multiplier = args.multiplier as bigint;

    console.log(`StockSplit: multiplier ${multiplier.toString()}`);

    this.dbQueries.insertCorporateAction(
      'split',
      { multiplier: multiplier.toString() },
      blockNumber,
      timestamp
    );

    // Update all balances by multiplying them
    const allBalances = this.dbQueries.getAllBalances();
    for (const balance of allBalances) {
      const newBalance = BigInt(balance.balance) * multiplier;
      this.dbQueries.upsertBalance(balance.address, newBalance.toString(), timestamp);
    }
  }

  // Handle SymbolChanged events
  private async handleSymbolChange(args: any, blockNumber: number, timestamp: number) {
    const oldName = args.oldName as string;
    const newName = args.newName as string;
    const oldSymbol = args.oldSymbol as string;
    const newSymbol = args.newSymbol as string;

    console.log(`SymbolChange: ${oldSymbol} (${oldName}) -> ${newSymbol} (${newName})`);

    this.dbQueries.insertCorporateAction(
      'rename',
      { oldName, newName, oldSymbol, newSymbol },
      blockNumber,
      timestamp
    );
  }

  // Manually index a specific block (useful for testing)
  async indexBlock(blockNumber: number) {
    await this.indexBlockRange(blockNumber, blockNumber);
  }

  // Get indexer status
  getStatus() {
    return {
      running: this.isRunning,
      lastIndexedBlock: this.dbQueries.getLastIndexedBlock()
    };
  }
}
