import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { logError, logInfo } from '../utils/logger';
import config from '../config/production';

dotenv.config();

// Create a connection pool with production configuration
const pool = new Pool({
  ...config.database,
  max: config.database.pool.max,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database tables
export const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    // Begin transaction
    await client.query('BEGIN');

    // Read and execute initialization SQL
    const initSqlPath = join(__dirname, 'init.sql');
    const initSql = readFileSync(initSqlPath, 'utf8');
    await client.query(initSql);

    // Run all migrations
    const migrationFiles = readdirSync(join(__dirname, '..', 'migrations'))
      .filter(f => f.endsWith('.sql'))
      .sort();
      
    for (const migrationFile of migrationFiles) {
      logInfo(`Running migration: ${migrationFile}`);
      const migrationSql = readFileSync(join(__dirname, '..', 'migrations', migrationFile), 'utf8');
      await client.query(migrationSql);
    }

    await client.query('COMMIT');
    logInfo('Database initialized and migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logError(error, 'Failed to initialize database');
    throw error;
  } finally {
    client.release();
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    logInfo('Database connection successful');
    client.release();
  } catch (error) {
    logError(error, 'Database connection failed');
    process.exit(1);
  }
};

// Run connection test on startup
testConnection();

export default pool;
