import axios from 'axios';

class InviteService {
  constructor() {
    this.apiUrl = `${import.meta.env.VITE_API_URL}/invites`;
  }

  async createInvite(email, role) {
    const response = await axios.post(this.apiUrl, { email, role });
    return response.data;
  }

  async createBulkInvites(emails, role) {
    const response = await axios.post(`${this.apiUrl}/bulk`, { emails, role });
    return response.data;
  }

  async checkInviteValidity(inviteId) {
    const response = await axios.get(`${this.apiUrl}/${inviteId}/check`);
    return response.data;
  }

  async markInviteAsUsed(inviteId) {
    await axios.post(`${this.apiUrl}/${inviteId}/use`);
  }

  async validateEmailDomain(email, role) {
    const response = await axios.post(`${this.apiUrl}/validate-domain`, { email, role });
    return response.data;
  }

  async checkInviteSpam(email) {
    const response = await axios.post(`${this.apiUrl}/check-spam`, { email });
    return response.data;
  }

  async resendInvite(email) {
    const response = await axios.post(`${this.apiUrl}/resend`, { email });
    return response.data;
  }

  async cancelInvite(inviteId) {
    const response = await axios.post(`${this.apiUrl}/${inviteId}/cancel`);
    return response.data;
  }

  /**
   * Validate encrypted invite token
   * @param {string} token - Encrypted token from invite URL
   * @returns {Promise<Object>} Validation result with invite details
   */
  async validateToken(token) {
    const response = await axios.post(`${this.apiUrl}/validate-token`, { token });
    return response.data;
  }
}

export const inviteService = new InviteService();
