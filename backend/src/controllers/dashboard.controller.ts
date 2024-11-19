import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { logError, logInfo } from '../utils/logger';
import { AuthenticatedRequest } from '../middlewares/adminAuth.middleware';
import { validationResult } from 'express-validator';

export class DashboardController {
  /**
   * Get admin dashboard statistics
   */
  static async getAdminStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const { data: stats, error } = await supabase.rpc('get_admin_dashboard_stats', {
        p_start_date: startDate as string,
        p_end_date: endDate as string
      });

      if (error) throw error;

      logInfo('Admin dashboard stats fetched successfully');

      return res.status(200).json({
        stats
      });
    } catch (error) {
      logError(error, 'getAdminStats');
      return res.status(500).json({ error: 'Failed to fetch admin dashboard statistics' });
    }
  }

  /**
   * Get recent activity logs
   */
  static async getActivityLogs(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, userRole } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          user:profiles(id, full_name, email, role)
        `, { count: 'exact' });

      if (userRole) {
        query = query.eq('user.role', userRole);
      }

      const { data: logs, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (error) throw error;

      logInfo('Activity logs fetched successfully', { count });

      return res.status(200).json({
        logs,
        total: count,
        page: Number(page),
        totalPages: Math.ceil((count || 0) / Number(limit))
      });
    } catch (error) {
      logError(error, 'getActivityLogs');
      return res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
  }

  /**
   * Get system health metrics
   */
  static async getSystemHealth(req: Request, res: Response) {
    try {
      // Get Supabase health status
      const { data: dbHealth, error: dbError } = await supabase.rpc('check_database_health');
      if (dbError) throw dbError;

      // Get storage metrics
      const { data: storageMetrics, error: storageError } = await supabase.rpc('get_storage_metrics');
      if (storageError) throw storageError;

      // Get recent errors
      const { data: recentErrors, error: errorLogsError } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (errorLogsError) throw errorLogsError;

      logInfo('System health metrics fetched successfully');

      return res.status(200).json({
        status: 'healthy',
        database: dbHealth,
        storage: storageMetrics,
        recentErrors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logError(error, 'getSystemHealth');
      return res.status(500).json({ error: 'Failed to fetch system health metrics' });
    }
  }

  /**
   * Get academic performance overview
   */
  static async getAcademicOverview(req: Request, res: Response) {
    try {
      const { academicYear, term } = req.query;

      const { data: overview, error } = await supabase.rpc('get_academic_overview', {
        p_academic_year: academicYear as string,
        p_term: term as string
      });

      if (error) throw error;

      logInfo('Academic overview fetched successfully');

      return res.status(200).json({
        overview
      });
    } catch (error) {
      logError(error, 'getAcademicOverview');
      return res.status(500).json({ error: 'Failed to fetch academic overview' });
    }
  }

  /**
   * Get user engagement metrics
   */
  static async getUserEngagement(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const { data: metrics, error } = await supabase.rpc('get_user_engagement_metrics', {
        p_start_date: startDate as string,
        p_end_date: endDate as string
      });

      if (error) throw error;

      logInfo('User engagement metrics fetched successfully');

      return res.status(200).json({
        metrics
      });
    } catch (error) {
      logError(error, 'getUserEngagement');
      return res.status(500).json({ error: 'Failed to fetch user engagement metrics' });
    }
  }
}
