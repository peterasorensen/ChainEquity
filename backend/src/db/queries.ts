import Database from 'better-sqlite3';
import { AllowlistEntry, BalanceEntry, TransactionEntry, CorporateActionEntry, CapTableEntry } from '../types';

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

  // Cap table operations
  getCapTable(blockNumber?: number): CapTableEntry[] {
    let balances: BalanceEntry[];

    if (blockNumber !== undefined) {
      // For historical cap table, we need to reconstruct balances at that block
      balances = this.getHistoricalBalances(blockNumber);
    } else {
      // Current cap table
      balances = this.getAllBalances();
    }

    // Calculate total supply
    const totalSupply = balances.reduce((sum, entry) => {
      return sum + BigInt(entry.balance);
    }, BigInt(0));

    // Calculate percentages
    return balances.map(entry => {
      const balance = BigInt(entry.balance);
      const percentage = totalSupply > 0
        ? Number((balance * BigInt(10000)) / totalSupply) / 100
        : 0;

      return {
        address: entry.address,
        balance: entry.balance,
        percentage
      };
    });
  }

  private getHistoricalBalances(blockNumber: number): BalanceEntry[] {
    // Get all transactions up to and including the specified block
    const stmt = this.db.prepare(`
      SELECT from_addr, to_addr, amount
      FROM transactions
      WHERE block_number <= ?
      ORDER BY block_number ASC, timestamp ASC
    `);

    const transactions = stmt.all(blockNumber) as Array<{
      from_addr: string;
      to_addr: string;
      amount: string;
    }>;

    // Reconstruct balances
    const balances = new Map<string, bigint>();

    for (const tx of transactions) {
      // Handle mints (from zero address)
      if (tx.from_addr === '0x0000000000000000000000000000000000000000') {
        const currentBalance = balances.get(tx.to_addr) || BigInt(0);
        balances.set(tx.to_addr, currentBalance + BigInt(tx.amount));
      } else {
        // Regular transfer
        const fromBalance = balances.get(tx.from_addr) || BigInt(0);
        const toBalance = balances.get(tx.to_addr) || BigInt(0);

        balances.set(tx.from_addr, fromBalance - BigInt(tx.amount));
        balances.set(tx.to_addr, toBalance + BigInt(tx.amount));
      }
    }

    // Convert to array and filter out zero balances
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
