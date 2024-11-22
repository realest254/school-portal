import cron from 'node-cron';
import { inviteService } from '../services/invite.service';
import { logger } from '../utils/logger';

// Run cleanup job every day at midnight
const cleanupJob = cron.schedule('0 0 * * *', async () => {
  try {
    logger.info('Starting expired invites cleanup job');
    await inviteService.cleanupExpiredInvites();
    logger.info('Completed expired invites cleanup job');
  } catch (error) {
    logger.error('Failed to run cleanup job:', error);
  }
}, {
  scheduled: false,
  timezone: process.env.TZ || 'UTC'
});

export const startCleanupJob = () => {
  cleanupJob.start();
  logger.info('Started expired invites cleanup job');
};

export const stopCleanupJob = () => {
  cleanupJob.stop();
  logger.info('Stopped expired invites cleanup job');
};
