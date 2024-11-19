export default {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || '0.0.0.0',
    corsOrigin: process.env.CORS_ORIGIN || 'https://your-frontend-domain.com',
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false, // For self-signed certificates
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  // Security configuration
  security: {
    supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100, // requests per window
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
  },

  // Cache configuration
  cache: {
    ttl: 60 * 60, // 1 hour
    checkPeriod: 60, // 1 minute
  },
};
