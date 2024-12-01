import { Request } from 'express';
import { UserRole } from '../middlewares/auth.middleware';

export interface AuthUser {
    id: string;
    role: UserRole;
    email: string;
}

export interface AuthenticatedRequest extends Request {
    user: AuthUser;
}

export class AuthorizationError extends Error {
    constructor(message: string = 'Access denied') {
        super(message);
        this.name = 'AuthorizationError';
    }
}

export const checkIsAdmin = (user?: AuthUser): boolean => {
    return user?.role === UserRole.ADMIN;
};

export const checkIsTeacher = (user?: AuthUser): boolean => {
    return user?.role === UserRole.TEACHER;
};

export const checkIsStudent = (user?: AuthUser): boolean => {
    return user?.role === UserRole.STUDENT;
};

export const checkIsAdminOrError = (user?: AuthUser): void => {
    if (!checkIsAdmin(user)) {
        throw new AuthorizationError('Access denied. Admin privileges required.');
    }
};

export const checkIsTeacherOrError = (user?: AuthUser): void => {
    if (!checkIsTeacher(user)) {
        throw new AuthorizationError('Access denied. Teacher privileges required.');
    }
};

export const checkIsStudentOrError = (user?: AuthUser): void => {
    if (!checkIsStudent(user)) {
        throw new AuthorizationError('Access denied. Student privileges required.');
    }
};

export const checkIsSameUserOrAdmin = (user?: AuthUser, targetUserId?: string): void => {
    if (!user || (!checkIsAdmin(user) && user.id !== targetUserId)) {
        throw new AuthorizationError('Access denied. Can only access your own data.');
    }
};

export const handleAuthError = (error: unknown) => {
    if (error instanceof AuthorizationError) {
        return {
            status: 403,
            success: false,
            error: error.message
        };
    }
    return null;
};
