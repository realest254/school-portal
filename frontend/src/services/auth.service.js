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
    const session = await this.supabase.auth.getSession();
    const adminToken = session?.data?.session?.access_token;
    
    if (!adminToken) {
      throw new Error('Not authorized to create invites');
    }

    const response = await axios.post(this.apiUrl, 
      { email, role },
      { 
        headers: { 
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );
    return response.data;
  }

  /**
   * Create multiple invites at once
   * @param {string[]} emails - Emails to invite
   * @param {string} role - Role to assign to the invites
   * @returns {Promise<Object>} Created invites details
   */
  async createBulkInvites(emails, role) {
    const session = await this.supabase.auth.getSession();
    const adminToken = session?.data?.session?.access_token;
    
    if (!adminToken) {
      throw new Error('Not authorized to create invites');
    }

    const response = await axios.post(
      `${this.apiUrl}/bulk`, 
      { emails, role },
      { 
        headers: { 
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );
    return response.data;
  }

  /**
   * Validate invite token
   * @param {string} token - Encrypted token from invite URL
   * @returns {Promise<Object>} Validation result with invite details
   */
  async validateInvite(token) {
    try {
      const response = await axios.post(`${this.apiUrl}/validate-invite`, { token });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to validate invite');
    }
  }

  /**
   * Sign up with invite
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} inviteId - Invite ID
   * @param {string} role - User role from invite token
   * @returns {Promise<Object>} Result of account creation
   */
  async signUpWithInvite({ email, password, inviteId, role }) {
    try {
      // Create user in Supabase
      const { data: { user }, error: signUpError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            invite_id: inviteId
          }
        }
      });

      if (signUpError) throw signUpError;

      // Accept the invite
      await axios.post(`${this.apiUrl}/accept`, {
        id: inviteId,
        email,
        role
      });

      return { user };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create account');
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