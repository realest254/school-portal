import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../utils/logger';

export class DashboardController {
  /**
   * Get dashboard statistics based on user role
   */
  static async getStats(req: Request, res: Response) {
    try {
      const { role, id } = req.user!; // User info from auth middleware

      const result = await pool.query(
        'SELECT get_dashboard_stats($1, $2) as stats',
        [role, id]
      );

      const stats = result.rows[0].stats;

      if (stats.error) {
        logger.error('Invalid role for dashboard stats:', { role });
        return res.status(400).json({ message: stats.error });
      }

      logger.info('Dashboard stats fetched successfully', { role });
      return res.status(200).json({ stats });
    } catch (error) {
      logger.error('Error in getStats:', error);
      return res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
  }
}