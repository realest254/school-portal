import dotenv from 'dotenv';

// Load environment variables from .env.test if it exists
dotenv.config({ path: '.env.test' });

// Mock any global dependencies here if needed
jest.mock('../db', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
  },
  initializeDatabase: jest.fn(),
}));
