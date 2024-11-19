export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Teacher {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  subjects?: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  email: string;
  fullName: string;
  grade?: string;
  class?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Class {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  academicYear: string;
  term: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeClasses: number;
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  action: string;
  userId: string;
  userRole: string;
  details: string;
  timestamp: Date;
}
