import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student'
}

interface JwtPayload {
  id: string;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Set user data in request
    req.user = {
      id: user.id,
      role: user.user_metadata?.role as UserRole,
      email: user.email!
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${Array.isArray(roles) ? roles.join(' or ') : roles}` 
      });
    }
    next();
  };
};
