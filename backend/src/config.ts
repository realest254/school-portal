export const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';
export const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/school_portal';
export const PORT = process.env.PORT || 3000;

// Notification settings
export const NOTIFICATION_DEFAULTS = {
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};
