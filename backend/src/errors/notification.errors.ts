export class NotificationError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

export const NotificationErrorCodes = {
  VALIDATION_ERROR: {
    code: 'NOTIFICATION.VALIDATION_ERROR',
    status: 400
  },
  NOT_FOUND: {
    code: 'NOTIFICATION.NOT_FOUND',
    status: 404
  },
  INVALID_STATUS_TRANSITION: {
    code: 'NOTIFICATION.INVALID_STATUS_TRANSITION',
    status: 400
  },
  EXPIRED: {
    code: 'NOTIFICATION.EXPIRED',
    status: 400
  },
  UNAUTHORIZED: {
    code: 'NOTIFICATION.UNAUTHORIZED',
    status: 403
  },
  DATABASE_ERROR: {
    code: 'NOTIFICATION.DATABASE_ERROR',
    status: 500
  }
} as const;
