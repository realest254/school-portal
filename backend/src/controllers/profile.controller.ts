import { Request, Response } from 'express';
import { profileService, CreateProfileDto } from '../services/profile.service';
import { logError } from '../utils/logger';

export const createProfile = async (req: Request, res: Response) => {
    try {
        const profileData: CreateProfileDto = req.body;

        // Basic validation
        if (!profileData.email || !profileData.role) {
            return res.status(400).json({
                message: 'Email and role are required'
            });
        }

        // Check if profile already exists
        const existingProfile = await profileService.getProfileByEmail(profileData.email);
        if (existingProfile) {
            return res.status(409).json({
                message: 'Profile already exists'
            });
        }

        const profile = await profileService.createProfile(profileData);
        res.status(201).json(profile);
    } catch (error) {
        logError(error, 'ProfileController - createProfile');
        res.status(500).json({
            message: 'Error creating profile'
        });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const email = req.params.email;
        const profile = await profileService.getProfileByEmail(email);
        
        if (!profile) {
            return res.status(404).json({
                message: 'Profile not found'
            });
        }

        res.json(profile);
    } catch (error) {
        logError(error, 'ProfileController - getProfile');
        res.status(500).json({
            message: 'Error fetching profile'
        });
    }
};
