import Database from 'better-sqlite3';

export const createSchema = (db: Database.Database) => {
  // Allowlist table - tracks which addresses are approved for token transfers
  db.exec(`
    CREATE TABLE IF NOT EXISTS allowlist (
      address TEXT PRIMARY KEY,
      approved BOOLEAN NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);

  // Create index for faster lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_allowlist_approved
    ON allowlist(approved)
  `);

  // Balances table - tracks current token balances for all addresses
  db.exec(`
    CREATE TABLE IF NOT EXISTS balances (
      address TEXT PRIMARY KEY,
      balance TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);

  // Transactions table - stores all transfer events for historical queries
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      hash TEXT PRIMARY KEY,
      from_addr TEXT NOT NULL,
      to_addr TEXT NOT NULL,
      amount TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);

  // Create indexes for efficient querying
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tx_from
    ON transactions(from_addr)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tx_to
    ON transactions(to_addr)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tx_block
    ON transactions(block_number)
  `);

  // Corporate actions table - stores split and rename events
  db.exec(`
    CREATE TABLE IF NOT EXISTS corporate_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);

  // Create index for block-based queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ca_block
    ON corporate_actions(block_number)
  `);

  // Create a table for tracking indexer state
  db.exec(`
    CREATE TABLE IF NOT EXISTS indexer_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_indexed_block INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  console.log('Database schema created successfully');
};
