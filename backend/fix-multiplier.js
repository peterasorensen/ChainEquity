const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'chainequity.db');
const db = new Database(dbPath);

console.log('Fixing stock split data in database...\n');

// Check current corporate actions
console.log('Current corporate actions:');
const currentActions = db.prepare('SELECT * FROM corporate_actions').all();
console.log(currentActions);

// Since the on-chain multiplier is 20, we need to add stock split events
// Let's add a 20x stock split at an early block
const blockNumber = 28634400; // Early block, before most transactions
const timestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds

console.log('\nAdding 20x stock split...');

const insertStmt = db.prepare(`
  INSERT INTO corporate_actions (type, data, block_number, timestamp)
  VALUES (?, ?, ?, ?)
`);

insertStmt.run(
  'split',
  JSON.stringify({ multiplier: '20' }),
  blockNumber,
  timestamp
);

console.log('Stock split added!');

// Verify
console.log('\nUpdated corporate actions:');
const updatedActions = db.prepare('SELECT * FROM corporate_actions').all();
console.log(updatedActions);

db.close();
console.log('\nDatabase updated successfully!');
console.log('Please restart the backend server for changes to take effect.');
