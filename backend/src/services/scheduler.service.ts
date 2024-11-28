import { Pool } from 'pg';
import pool from '../db';
import SQL from 'sql-template-strings';
import cron from 'node-cron';

export class SchedulerService {
    private db: Pool;

    constructor() {
        this.db = pool;
    }

    /**
     * Updates expired notifications as a backup to the trigger
     * Runs daily at midnight
     */
    startNotificationExpiryJob(): void {
        cron.schedule('0 0 * * *', async () => {
            try {
                const query = SQL`SELECT batch_update_expired_notifications()`;
                await this.db.query(query);
                console.log('Successfully ran notification expiry job');
            } catch (error) {
                console.error('Error running notification expiry job:', error);
            }
        });
    }
}
