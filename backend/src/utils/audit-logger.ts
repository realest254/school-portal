import winston from 'winston';
import { UserRole } from '../types/invite.types';

interface AuditLogData {
  action: string;
  userId: string;
  userRole: UserRole;
  resourceType: string;
  resourceId?: string;
  details?: any;
  ip?: string;
  status: 'success' | 'failure';
  errorDetails?: any;
}

const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'invite-service' },
  transports: [
    new winston.transports.File({
      filename: 'audit.log',
      dirname: 'logs/audit',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  auditLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export const logAuditEvent = (data: AuditLogData) => {
  auditLogger.info({
    timestamp: new Date().toISOString(),
    ...data,
    environment: process.env.NODE_ENV
  });
};

export const logInviteCreated = (userId: string, userRole: UserRole, inviteId: string, email: string, role: UserRole, ip?: string) => {
  logAuditEvent({
    action: 'INVITE_CREATED',
    userId,
    userRole,
    resourceType: 'invite',
    resourceId: inviteId,
    details: { email, role },
    ip,
    status: 'success'
  });
};

export const logInviteAccepted = (userId: string, userRole: UserRole, inviteId: string, ip?: string) => {
  logAuditEvent({
    action: 'INVITE_ACCEPTED',
    userId,
    userRole,
    resourceType: 'invite',
    resourceId: inviteId,
    ip,
    status: 'success'
  });
};

export const logInviteCancelled = (userId: string, userRole: UserRole, inviteId: string, ip?: string) => {
  logAuditEvent({
    action: 'INVITE_CANCELLED',
    userId,
    userRole,
    resourceType: 'invite',
    resourceId: inviteId,
    ip,
    status: 'success'
  });
};

export const logInviteError = (
  action: string,
  userId: string,
  userRole: UserRole,
  error: any,
  details?: any,
  ip?: string
) => {
  logAuditEvent({
    action,
    userId,
    userRole,
    resourceType: 'invite',
    details,
    ip,
    status: 'failure',
    errorDetails: {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: error.code,
      status: error.status
    }
  });
};

export default auditLogger;
