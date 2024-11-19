import pool from '../db';
import { logError } from '../utils/logger';

export interface CreateProfileDto {
    email: string;
    full_name?: string;
    role: string;
    metadata?: Record<string, any>;
}

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    created_at: Date;
    updated_at: Date;
    metadata: Record<string, any>;
    is_active: boolean;
    last_login: Date | null;
}

class ProfileService {
    async createProfile(profileData: CreateProfileDto): Promise<Profile> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { rows } = await client.query(
                `INSERT INTO profiles (email, full_name, role, metadata)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [profileData.email, profileData.full_name, profileData.role, profileData.metadata || {}]
            );

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logError(error, 'ProfileService - createProfile');
            throw error;
        } finally {
            client.release();
        }
    }

    async getProfileByEmail(email: string): Promise<Profile | null> {
        try {
            const { rows } = await pool.query(
                'SELECT * FROM profiles WHERE email = $1',
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            logError(error, 'ProfileService - getProfileByEmail');
            throw error;
        }
    }

    async updateLastLogin(email: string): Promise<void> {
        try {
            await pool.query(
                'UPDATE profiles SET last_login = CURRENT_TIMESTAMP WHERE email = $1',
                [email]
            );
        } catch (error) {
            logError(error, 'ProfileService - updateLastLogin');
            throw error;
        }
    }
}

export const profileService = new ProfileService();
