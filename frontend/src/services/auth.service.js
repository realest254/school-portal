import { supabase } from '../lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '../utils/encryption'
import zxcvbn from 'zxcvbn'
import { inviteService } from './invite.service'

const SECURITY_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_REQUIREMENTS: {
    hasUpperCase: /[A-Z]/,
    hasLowerCase: /[a-z]/,
    hasNumbers: /\d/,
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/
  },
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_REFRESH_BUFFER: 5 * 60 * 1000, // 5 minutes
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000 // 5 minutes
};

class AuthService {
  constructor() {
    this.supabase = supabase;
    this.sessionRefreshTimer = null;
    this.loginAttempts = new Map();
    this.lastFailedLogin = new Map();
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
   * Check if account is locked due to too many failed attempts
   * @param {string} email - User email
   * @returns {boolean} Whether account is locked
   * @private
   */
  _isAccountLocked(email) {
    const lastFailed = this.lastFailedLogin.get(email);
    if (!lastFailed) return false;

    const timeSinceLastFail = Date.now() - lastFailed;
    return timeSinceLastFail < SECURITY_CONSTANTS.LOCKOUT_DURATION;
  }

  /**
   * Track failed login attempt
   * @param {string} email - User email
   * @private
   */
  _trackFailedLogin(email) {
    const attempts = (this.loginAttempts.get(email) || 0) + 1;
    this.loginAttempts.set(email, attempts);

    if (attempts >= SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
      this.lastFailedLogin.set(email, Date.now());
      throw new Error('Account temporarily locked. Please try again later.');
    }
  }

  /**
   * Reset login attempts counter
   * @param {string} email - User email
   * @private
   */
  _resetLoginAttempts(email) {
    this.loginAttempts.delete(email);
    this.lastFailedLogin.delete(email);
  }

  /**
   * Secure sign in with rate limiting and account lockout
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} mfaCode - Optional MFA code
   * @returns {Promise<Object>} Auth data
   */
  async signIn(email, password, mfaCode = null) {
    try {
      if (this._isAccountLocked(email)) {
        const lockoutTime = Math.ceil((SECURITY_CONSTANTS.LOCKOUT_DURATION - (Date.now() - this.lastFailedLogin.get(email))) / 60000);
        throw new Error(`Account temporarily locked for security. Please try again in ${lockoutTime} minutes.`);
      }

      // Validate credentials
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          ...(mfaCode && { mfaCode })
        }
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          const attemptsLeft = SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS - (this.loginAttempts.get(email) || 0);
          throw new Error(`Incorrect email or password. ${attemptsLeft} attempts remaining before temporary lockout.`);
        }
        this._trackFailedLogin(email);
        throw error;
      }

      // Reset login attempts on successful login
      this._resetLoginAttempts(email);

      // Start session management
      if (data.session) {
        this._startSessionManagement(data.session);
      }

      return {
        status: 'success',
        message: 'Successfully logged in. Welcome back!',
        data
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Start secure session management
   * @param {Object} session - Session object
   * @private
   */
  _startSessionManagement(session) {
    // Clear any existing timer
    if (this.sessionRefreshTimer) {
      clearTimeout(this.sessionRefreshTimer);
    }

    // Store session securely
    const encryptedSession = encrypt(JSON.stringify({
      ...session,
      lastActivity: Date.now()
    }));
    sessionStorage.setItem('secure_session', encryptedSession);

    // Set up session refresh
    const expiresAt = new Date(session.expires_at).getTime();
    const refreshTime = expiresAt - SECURITY_CONSTANTS.SESSION_REFRESH_BUFFER;
    const now = Date.now();

    if (refreshTime > now) {
      this.sessionRefreshTimer = setTimeout(
        () => this._refreshSession(),
        refreshTime - now
      );
    }
  }

  /**
   * Refresh session securely
   * @private
   */
  async _refreshSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.refreshSession();
      
      if (error) throw error;
      
      if (session) {
        this._startSessionManagement(session);
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      this.signOut(); // Force sign out on refresh failure
    }
  }

  /**
   * Secure sign out with cleanup
   */
  async signOut() {
    try {
      // Clear session management
      if (this.sessionRefreshTimer) {
        clearTimeout(this.sessionRefreshTimer);
      }

      // Clear secure storage
      sessionStorage.removeItem('secure_session');
      localStorage.removeItem('supabase.auth.token');

      // Sign out from Supabase
      await this.supabase.auth.signOut();

      // Clear any remaining auth data
      this.loginAttempts.clear();
      this.lastFailedLogin.clear();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Create invite record
   * @param {string} email - Email to invite
   * @param {string} role - Role to assign
   * @returns {Promise<Object>} Invite data
   */
  async createInviteRecord(email, role) {
    try {
      // Check if user already exists
      const userExists = await this._checkUserExists(email);
      if (userExists) {
        throw new Error('User already exists');
      }

      // Create invite using the invite service
      const invite = await inviteService.createInvite(email, role);
      
      // Send invite email
      await this._sendInviteEmail(email, role, invite.id);
      
      return invite;
    } catch (error) {
      console.error('Error creating invite:', error);
      throw error;
    }
  }

  /**
   * Invite a single teacher
   * @param {string} email - Teacher email
   * @returns {Promise<Object>} Invite result
   */
  async inviteTeacher(email) {
    return this.createInviteRecord(email, 'teacher');
  }

  /**
   * Invite a single student
   * @param {string} email - Student email
   * @returns {Promise<Object>} Invite result
   */
  async inviteStudent(email) {
    return this.createInviteRecord(email, 'student');
  }

  /**
   * Invite multiple teachers
   * @param {Array<string>} emails - Array of teacher emails
   * @returns {Promise<Array<Object>>} Array of invite data
   */
  async inviteTeachers(emails) {
    return inviteService.createBulkInvites(emails, 'teacher');
  }

  /**
   * Invite multiple students
   * @param {Array<string>} emails - Array of student emails
   * @returns {Promise<Array<Object>>} Array of invite data
   */
  async inviteStudents(emails) {
    return inviteService.createBulkInvites(emails, 'student');
  }

  /**
   * Check if invite is valid
   * @param {string} inviteId - ID of the invite to check
   * @returns {Promise<Object>} Invite status
   */
  async checkInviteValidity(inviteId) {
    return inviteService.checkInviteValidity(inviteId);
  }

  /**
   * Accept invite and create account
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} inviteId - Invite ID
   * @returns {Promise<Object>} Auth data
   */
  async acceptInvite(email, password, inviteId) {
    try {
      // Check invite validity first
      const { valid, reason, invite } = await this.checkInviteValidity(inviteId);
      if (!valid) {
        throw new Error(`Invalid invite: ${reason}`);
      }

      // Create the user account with role in metadata
      const { data: authData, error: signUpError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: invite.role,
            invited_by: invite.invited_by
          }
        }
      });

      if (signUpError) throw signUpError;

      // Mark the invite as used
      await inviteService.markInviteAsUsed(inviteId);

      // Return auth data with role
      return {
        ...authData,
        role: invite.role
      };
    } catch (error) {
      console.error('Error accepting invite:', error);
      throw error;
    }
  }

  /**
   * Send invite email using role-specific template
   * @param {string} email - Recipient email
   * @param {string} role - User role
   * @param {string} inviteId - Invite ID
   * @private
   */
  async _sendInviteEmail(email, role, inviteId) {
    try {
      const templatePath = role === 'student' 
        ? '/email-templates/student-invite.html'
        : '/email-templates/teacher-invite.html';

      const { error } = await this.supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: `Welcome to School Portal - ${role.charAt(0).toUpperCase() + role.slice(1)} Invitation`,
          templatePath,
          templateData: {
            signUpUrl: `${window.location.origin}/auth/signup?token=${encrypt(inviteId)}`,
            role: role,
            inviteId: inviteId
          }
        }
      });

      if (error) {
        // Mark invite as failed
        await inviteService.markInviteAsFailed(inviteId, error.message);
        throw error;
      }

      // Mark email as sent
      await inviteService.markInviteAsSent(inviteId);
    } catch (error) {
      throw new Error(`Failed to send invite email: ${error.message}`);
    }
  }

  /**
   * Check if user already exists
   * @param {string} email - Email to check
   * @returns {Promise<Object>} User existence status and details
   * @private
   */
  async _checkUserExists(email) {
    const { data: { users }, error } = await this.supabase.auth.admin.listUsers({
      filter: {
        email: email
      }
    });

    if (error) throw error;

    if (users && users.length > 0) {
      const user = users[0];
      return {
        exists: true,
        user: {
          email: user.email,
          role: user.user_metadata.role,
          metadata: {
            created_at: user.created_at,
            last_sign_in: user.last_sign_in_at
          }
        }
      };
    }

    return { exists: false };
  }

  /**
   * Get current session securely
   * @returns {Promise<Object|null>} Session data
   */
  async getSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session) {
        const sessionData = sessionStorage.getItem('secure_session');
        if (sessionData) {
          const decryptedSession = JSON.parse(decrypt(sessionData));
          // Verify session integrity
          if (decryptedSession.access_token !== session.access_token) {
            await this.signOut();
            throw new Error('Session integrity check failed');
          }
        }
      }
      
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }
}

export const authService = new AuthService();