import { initializeDatabase } from '../src/db';
import { logInfo, logError } from '../src/utils/logger';

const runMigrations = async () => {
  try {
    logInfo('Starting database initialization and migrations...');
    await initializeDatabase();
    logInfo('Database initialization and migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logError(error, 'Failed to run migrations');
    process.exit(1);
  }
};

runMigrations();
