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
    this.apiUrl = `${import.meta.env.VITE_API_URL}/invites`;
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
   * Create a new invite
   * @param {string} email - Email to invite
   * @param {string} role - Role to assign to the invite
   * @returns {Promise<Object>} Created invite details
   */
  async createInvite(email, role) {
    const response = await axios.post(this.apiUrl, { email, role });
    return response.data;
  }

  /**
   * Create multiple invites at once
   * @param {string[]} emails - Emails to invite
   * @param {string} role - Role to assign to the invites
   * @returns {Promise<Object>} Created invites details
   */
  async createBulkInvites(emails, role) {
    const response = await axios.post(`${this.apiUrl}/bulk`, { emails, role });
    return response.data;
  }

  /**
   * Validate and decrypt invite token
   * @param {string} token - Encrypted token from invite URL
   * @returns {Promise<Object>} Validation result with invite details
   */
  async validateToken(token) {
    const response = await axios.post(`${this.apiUrl}/decrypt-token`, { token });
    return response.data;
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
      const response = await axios.post(`${this.apiUrl}/accept`, { 
        inviteId, 
        email, 
        role 
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to accept invite');
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
      throw new Error(error.message || 'Failed to create account');
    }
  }

  /**
   * Get invite history for an email
   * @param {string} email - Email to get invite history for
   * @returns {Promise<Object>} Invite history
   */
  async getInviteHistory(email) {
    const response = await axios.get(`${this.apiUrl}/history`, { params: { email } });
    return response.data;
  }
}

export const authService = new AuthService();