import React, { useState } from 'react';
import { authService } from '../services/auth.service';
import { toast } from 'react-toastify';

const InviteUsers = () => {
  const [formData, setFormData] = useState({
    emails: '',
    role: 'student',
    loading: false,
    error: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      error: null
    }));
  };

  const validateEmails = (emails) => {
    if (emails.length === 0) {
      throw new Error('Please enter at least one email address');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      throw new Error(`Invalid email format: ${invalidEmails.join(', ')}`);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setFormData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Split and clean email inputs
      const emailList = formData.emails
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      // Validate emails
      validateEmails(emailList);

      // Get admin token
      const session = await authService.supabase.auth.getSession();
      const adminToken = session?.data?.session?.access_token;
      
      if (!adminToken) {
        throw new Error('Not authorized to send invites');
      }

      // Send invites
      if (emailList.length === 1) {
        await authService.createInvite(emailList[0], formData.role);
        toast.success('Invite sent successfully!');
      } else {
        await authService.createBulkInvites(emailList, formData.role);
        toast.success(`${emailList.length} invites sent successfully!`);
      }

      // Clear form
      setFormData(prev => ({
        ...prev,
        emails: '',
        loading: false
      }));
    } catch (error) {
      console.error('Failed to send invites:', error);
      setFormData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to send invites. Please try again.'
      }));
      toast.error(error.message || 'Failed to send invites. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Invite Users</h2>

      <form onSubmit={handleInviteSubmit} className="space-y-6">
        <div>
          <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-2">
            Email Addresses
          </label>
          <div className="mt-1">
            <textarea
              id="emails"
              name="emails"
              rows={4}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              placeholder="Enter email addresses (comma-separated for multiple invites)"
              value={formData.emails}
              onChange={handleInputChange}
              disabled={formData.loading}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            For multiple invites, separate email addresses with commas (e.g., email1@example.com, email2@example.com)
          </p>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            disabled={formData.loading}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        {formData.error && (
          <div className="text-red-600 text-sm mt-2">
            {formData.error}
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={formData.loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {formData.loading ? 'Sending Invites...' : 'Send Invites'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InviteUsers;
