// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Authentication Configuration
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// App Configuration
export const APP_NAME = 'School Portal';
export const APP_VERSION = '1.0.0';

// File Upload Configuration
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// Pagination Configuration
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

// Date Format Configuration
export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';
export const DEFAULT_TIME_FORMAT = 'HH:mm:ss';
export const DEFAULT_DATETIME_FORMAT = `${DEFAULT_DATE_FORMAT} ${DEFAULT_TIME_FORMAT}`;
