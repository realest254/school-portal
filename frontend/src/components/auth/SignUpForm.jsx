import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { toast } from 'react-toastify';

export function SignUpForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteDetails, setInviteDetails] = useState(null);

  useEffect(() => {
    const validateInvite = async () => {
      try {
        const token = searchParams.get('token');
        if (!token) {
          setError('Invalid invite link. Missing token.');
          setLoading(false);
          return;
        }

        const result = await authService.validateInvite(token);
        
        if (!result.valid) {
          setError(getErrorMessage(result.reason));
          setLoading(false);
          return;
        }

        setInviteDetails(result.invite);
        setFormData(prev => ({ ...prev, email: result.invite.email }));
      } catch (err) {
        setError('Invalid or expired invite link.');
      } finally {
        setLoading(false);
      }
    };

    validateInvite();
  }, [searchParams]);

  const getErrorMessage = (reason) => {
    switch (reason) {
      case 'expired':
        return 'This invite has expired. Please request a new one.';
      case 'already_used':
        return 'This invite has already been used.';
      case 'invalid':
      default:
        return 'Invalid invite link. Please request a new invitation.';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate passwords
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      // Create user account and accept invite
      const { user } = await authService.signUpWithInvite({
        email: inviteDetails.email,
        password: formData.password,
        inviteId: inviteDetails.id,
        role: inviteDetails.role
      });

      if (user) {
        toast.success('Account created successfully! Please log in to continue.');
        // Redirect to login instead of dashboard
        navigate('/login', { 
          state: { 
            email: inviteDetails.email,
            message: 'Account created successfully! Please log in to continue.' 
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
      toast.error(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !inviteDetails) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Your Account</h2>
      
      {inviteDetails && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-md">
          <p className="text-sm text-indigo-700">
            You've been invited to join as a <span className="font-semibold">{inviteDetails.role}</span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            disabled
            className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-gray-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}

export default SignUpForm;
