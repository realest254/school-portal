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

    // Verify token using Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get user's role from metadata
    const role = user.user_metadata?.role;

    if (!role) {
      return res.status(401).json({ message: 'User role not found' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email!,
      role: role as UserRole
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export const requireRole = (role: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};
