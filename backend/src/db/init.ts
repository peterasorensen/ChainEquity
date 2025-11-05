import Database from 'better-sqlite3';
import path from 'path';
import { createSchema } from './schema';

let db: Database.Database | null = null;

export const initializeDatabase = (dbPath?: string): Database.Database => {
  if (db) {
    return db;
  }

  const finalPath = dbPath || path.join(process.cwd(), 'chainequity.db');
  console.log(`Initializing database at: ${finalPath}`);

  db = new Database(finalPath);

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');

  // Create schema
  createSchema(db);

  return db;
};

export const getDatabase = (): Database.Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
};
