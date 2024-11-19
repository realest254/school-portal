import { Router } from 'express';
import { createProfile, getProfile } from '../controllers/profile.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Create profile (requires valid Supabase token)
router.post('/', verifyToken, createProfile);

// Get profile by email (requires valid Supabase token)
router.get('/:email', verifyToken, getProfile);

export default router;
