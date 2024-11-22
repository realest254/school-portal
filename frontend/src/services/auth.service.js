import { supabase } from '../lib/supabase'
import axios from 'axios';
import zxcvbn from 'zxcvbn'

const SECURITY_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_REQUIREMENTS: {
    hasUpperCase: /[A-Z]/,
    hasLowerCase: /[a-z]/,
    hasNumbers: /\d/,
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/
  }
};

class AuthService {
  constructor() {
    this.supabase = supabase;
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'; // Update with your backend API URL
  }

  /**
   * Validate password strength and requirements
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with strength score and feedback
   */
  validatePassword(password) {
    if (!password || password.length < SECURITY_CONSTANTS.PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must be at least ${SECURITY_CONSTANTS.PASSWORD_MIN_LENGTH} characters long`);
    }

    // Check password requirements
    const requirements = SECURITY_CONSTANTS.PASSWORD_REQUIREMENTS;
    const missingRequirements = [];

    if (!requirements.hasUpperCase.test(password)) missingRequirements.push('uppercase letter');
    if (!requirements.hasLowerCase.test(password)) missingRequirements.push('lowercase letter');
    if (!requirements.hasNumbers.test(password)) missingRequirements.push('number');
    if (!requirements.hasSpecialChar.test(password)) missingRequirements.push('special character');

    if (missingRequirements.length > 0) {
      throw new Error(`Password must contain: ${missingRequirements.join(', ')}`);
    }

    // Check password strength using zxcvbn
    const strength = zxcvbn(password);
    if (strength.score < 3) {
      throw new Error(`Password is too weak: ${strength.feedback.warning}`);
    }

    return strength;
  }

  /**
   * Check invite token validity
   * @param {string} token - Encrypted invite token
   * @returns {Promise<Object>} Validation result
   */
  async checkInviteToken(token) {
    try {
      const response = await axios.post(`${this.apiUrl}/invites/decrypt-token`, { token });
      const { valid, data, message } = response.data;
      
      if (!valid) {
        return {
          valid: false,
          reason: message
        };
      }

      return {
        valid: true,
        invite: data
      };
    } catch (error) {
      console.error('Error decrypting token:', error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  /**
   * Accept invite and create account without automatic sign in
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} inviteId - Invite ID
   * @param {string} role - User role from invite token
   * @returns {Promise<Object>} Result of account creation
   */
  async acceptInvite(email, password, inviteId, role) {
    try {
      // First accept the invite in our backend
      const acceptResponse = await axios.post(`${this.apiUrl}/invites/accept`, {
        inviteId,
        email,
        role
      });

      if (!acceptResponse.data.success) {
        throw new Error(acceptResponse.data.message || 'Failed to accept invite');
      }

      // Then sign up user with Supabase without auto sign in
      const { data: authData, error: signUpError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role
          },
          emailRedirectTo: `${window.location.origin}/auth/login`
        }
      });

      if (signUpError) throw signUpError;

      return {
        success: true,
        message: 'Account created successfully. Please check your email and sign in.',
        email: email,
        role: role
      };
    } catch (error) {
      console.error('Error accepting invite:', error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }
}

export const authService = new AuthService();