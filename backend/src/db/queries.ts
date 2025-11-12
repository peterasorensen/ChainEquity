import Database from 'better-sqlite3';
import { AllowlistEntry, BalanceEntry, TransactionEntry, CorporateActionEntry } from '../types';

export class DatabaseQueries {
  constructor(private db: Database.Database) {}

  // Allowlist operations
  upsertAllowlist(address: string, approved: boolean, timestamp: number) {
    const stmt = this.db.prepare(`
      INSERT INTO allowlist (address, approved, timestamp)
      VALUES (?, ?, ?)
      ON CONFLICT(address) DO UPDATE SET
        approved = excluded.approved,
        timestamp = excluded.timestamp
    `);
    stmt.run(address.toLowerCase(), approved ? 1 : 0, timestamp);
  }

  getAllowlistStatus(address: string): AllowlistEntry | null {
    const stmt = this.db.prepare(`
      SELECT address, approved, timestamp
      FROM allowlist
      WHERE address = ?
    `);
    const row = stmt.get(address.toLowerCase()) as any;
    if (!row) return null;
    return {
      address: row.address,
      approved: Boolean(row.approved),
      timestamp: row.timestamp
    };
  }

  getAllAllowlisted(): AllowlistEntry[] {
    const stmt = this.db.prepare(`
      SELECT address, approved, timestamp
      FROM allowlist
      WHERE approved = 1
      ORDER BY timestamp DESC
    `);
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      address: row.address,
      approved: Boolean(row.approved),
      timestamp: row.timestamp
    }));
  }

  // Balance operations
  upsertBalance(address: string, balance: string, timestamp: number) {
    const stmt = this.db.prepare(`
      INSERT INTO balances (address, balance, timestamp)
      VALUES (?, ?, ?)
      ON CONFLICT(address) DO UPDATE SET
        balance = excluded.balance,
        timestamp = excluded.timestamp
    `);
    stmt.run(address.toLowerCase(), balance, timestamp);
  }

  getBalance(address: string): BalanceEntry | null {
    const stmt = this.db.prepare(`
      SELECT address, balance, timestamp
      FROM balances
      WHERE address = ?
    `);
    return stmt.get(address.toLowerCase()) as BalanceEntry | null;
  }

  getAllBalances(): BalanceEntry[] {
    const stmt = this.db.prepare(`
      SELECT address, balance, timestamp
      FROM balances
      ORDER BY CAST(balance AS INTEGER) DESC
    `);
    return stmt.all() as BalanceEntry[];
  }

  // Transaction operations
  insertTransaction(tx: Omit<TransactionEntry, 'hash'> & { hash: string }) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO transactions (hash, from_addr, to_addr, amount, block_number, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      tx.hash,
      tx.from_addr.toLowerCase(),
      tx.to_addr.toLowerCase(),
      tx.amount,
      tx.block_number,
      tx.timestamp
    );
  }

  getTransactionsByAddress(address: string): TransactionEntry[] {
    const stmt = this.db.prepare(`
      SELECT hash, from_addr, to_addr, amount, block_number, timestamp
      FROM transactions
      WHERE from_addr = ? OR to_addr = ?
      ORDER BY block_number DESC, timestamp DESC
    `);
    const addr = address.toLowerCase();
    return stmt.all(addr, addr) as TransactionEntry[];
  }

  getAllTransactions(): TransactionEntry[] {
    const stmt = this.db.prepare(`
      SELECT hash, from_addr, to_addr, amount, block_number, timestamp
      FROM transactions
      ORDER BY block_number DESC, timestamp DESC
    `);
    return stmt.all() as TransactionEntry[];
  }

  getTransactionsByBlock(blockNumber: number): TransactionEntry[] {
    const stmt = this.db.prepare(`
      SELECT hash, from_addr, to_addr, amount, block_number, timestamp
      FROM transactions
      WHERE block_number = ?
      ORDER BY timestamp
    `);
    return stmt.all(blockNumber) as TransactionEntry[];
  }

  // Corporate action operations
  insertCorporateAction(type: 'split' | 'rename', data: any, blockNumber: number, timestamp: number) {
    const stmt = this.db.prepare(`
      INSERT INTO corporate_actions (type, data, block_number, timestamp)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(type, JSON.stringify(data), blockNumber, timestamp);
  }

  getCorporateActions(): CorporateActionEntry[] {
    const stmt = this.db.prepare(`
      SELECT id, type, data, block_number, timestamp
      FROM corporate_actions
      ORDER BY block_number DESC
    `);
    return stmt.all() as CorporateActionEntry[];
  }

  // Get cumulative multiplier from all stock splits
  getCumulativeMultiplier(): bigint {
    const stmt = this.db.prepare(`
      SELECT data
      FROM corporate_actions
      WHERE type = 'split'
      ORDER BY block_number ASC
    `);

    const splits = stmt.all() as Array<{ data: string }>;

    let cumulativeMultiplier = BigInt(1);
    for (const split of splits) {
      const splitData = JSON.parse(split.data);
      const multiplier = BigInt(splitData.multiplier);
      cumulativeMultiplier *= multiplier;
    }

    return cumulativeMultiplier;
  }

  // Get cumulative multiplier from stock splits that occurred after a specific block
  getCumulativeMultiplierAfterBlock(blockNumber: number): bigint {
    const stmt = this.db.prepare(`
      SELECT data
      FROM corporate_actions
      WHERE type = 'split' AND block_number > ?
      ORDER BY block_number ASC
    `);

    const splits = stmt.all(blockNumber) as Array<{ data: string }>;

    let cumulativeMultiplier = BigInt(1);
    for (const split of splits) {
      const splitData = JSON.parse(split.data);
      const multiplier = BigInt(splitData.multiplier);
      cumulativeMultiplier *= multiplier;
    }

    return cumulativeMultiplier;
  }


  // Public method that takes current balances from blockchain
  getHistoricalBalancesFromCurrent(blockNumber: number, currentBalances: Array<{ address: string; balance: bigint }>, contractMultiplier: bigint): BalanceEntry[] {
    const balances = new Map<string, bigint>();

    // Initialize with current blockchain balances
    for (const entry of currentBalances) {
      balances.set(entry.address, entry.balance);
    }

    console.log(`\n=== Historical Balance Calculation for block ${blockNumber} ===`);
    console.log('Starting balances (from blockchain):', Array.from(balances.entries()).map(([addr, bal]) => `${addr.slice(0,8)}: ${bal.toString()}`));

    // Get all transactions that happened AFTER the queried block
    // We'll reverse these to get the historical state
    const stmt = this.db.prepare(`
      SELECT from_addr, to_addr, amount, block_number
      FROM transactions
      WHERE block_number > ?
      ORDER BY block_number DESC, timestamp DESC
    `);

    const futureTransactions = stmt.all(blockNumber) as Array<{
      from_addr: string;
      to_addr: string;
      amount: string;
      block_number: number;
    }>;

    console.log(`Found ${futureTransactions.length} transactions after block ${blockNumber}`);

    // Use the contract multiplier for transaction amounts
    // Transaction amounts in DB are raw on-chain values, but current blockchain balances include multiplier
    const multiplier = contractMultiplier;
    console.log('Multiplier for tx amounts:', multiplier.toString(), '(', Number(multiplier) / 1e18, 'x)');

    // Reverse the transactions to go back in time
    for (const tx of futureTransactions) {
      // Apply multiplier to transaction amount since blockchain balances have multiplier applied
      const rawAmount = BigInt(tx.amount);
      const amount = rawAmount * multiplier / BigInt(1e18);

      console.log(`\nReversing tx at block ${tx.block_number}: ${tx.from_addr.slice(0,8)} -> ${tx.to_addr.slice(0,8)}`);
      console.log(`  Raw amount: ${rawAmount.toString()}, Adjusted: ${amount.toString()}`);

      // Handle burns (to zero address) - reverse by adding back to sender
      if (tx.to_addr === '0x0000000000000000000000000000000000000000') {
        const fromBalance = balances.get(tx.from_addr) || BigInt(0);
        console.log(`  BURN reversal: ${tx.from_addr.slice(0,8)} ${fromBalance.toString()} + ${amount.toString()}`);
        balances.set(tx.from_addr, fromBalance + amount);
      }
      // Handle mints (from zero address) - reverse by subtracting from recipient
      else if (tx.from_addr === '0x0000000000000000000000000000000000000000') {
        const toBalance = balances.get(tx.to_addr) || BigInt(0);
        console.log(`  MINT reversal: ${tx.to_addr.slice(0,8)} ${toBalance.toString()} - ${amount.toString()} = ${(toBalance - amount).toString()}`);
        balances.set(tx.to_addr, toBalance - amount);
      }
      // Regular transfer - reverse by subtracting from recipient and adding to sender
      else {
        const fromBalance = balances.get(tx.from_addr) || BigInt(0);
        const toBalance = balances.get(tx.to_addr) || BigInt(0);

        console.log(`  TRANSFER reversal: ${tx.from_addr.slice(0,8)} ${fromBalance.toString()} + ${amount.toString()}, ${tx.to_addr.slice(0,8)} ${toBalance.toString()} - ${amount.toString()}`);
        balances.set(tx.from_addr, fromBalance + amount);
        balances.set(tx.to_addr, toBalance - amount);
      }
    }

    console.log('\nFinal balances:', Array.from(balances.entries()).map(([addr, bal]) => `${addr.slice(0,8)}: ${bal.toString()}`));
    console.log('=== End Historical Balance Calculation ===\n');

    // Convert to array and filter out zero or negative balances
    const result: BalanceEntry[] = [];
    for (const [address, balance] of balances.entries()) {
      if (balance > BigInt(0)) {
        result.push({
          address,
          balance: balance.toString(),
          timestamp: Date.now() // Historical reconstruction
        });
      }
    }

    return result;
  }

  // Indexer state operations
  getLastIndexedBlock(): number | null {
    const stmt = this.db.prepare(`
      SELECT last_indexed_block
      FROM indexer_state
      WHERE id = 1
    `);
    const row = stmt.get() as { last_indexed_block: number } | undefined;
    return row?.last_indexed_block ?? null;
  }

  updateLastIndexedBlock(blockNumber: number) {
    const stmt = this.db.prepare(`
      INSERT INTO indexer_state (id, last_indexed_block, updated_at)
      VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        last_indexed_block = excluded.last_indexed_block,
        updated_at = excluded.updated_at
    `);
    stmt.run(blockNumber, Date.now());
  }
}
