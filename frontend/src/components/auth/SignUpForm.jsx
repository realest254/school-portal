import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../../services/auth.service'
import { inviteService } from '../../services/invite.service'

export function SignUpForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inviteDetails, setInviteDetails] = useState(null)

  // Validate token from URL parameters
  useEffect(() => {
    const validateInvite = async () => {
      try {
        const token = searchParams.get('token')
        if (!token) {
          setError('Invalid invite link. Missing token.')
          return
        }

        const result = await inviteService.validateToken(token)
        
        if (!result.valid) {
          setError(getErrorMessage(result.reason))
          return
        }

        setInviteDetails(result.invite)
        setFormData(prev => ({ ...prev, email: result.invite.email }))
      } catch (err) {
        setError('Invalid or expired invite link.')
      }
    }

    validateInvite()
  }, [searchParams])

  const getErrorMessage = (reason) => {
    switch (reason) {
      case 'expired':
        return 'This invite has expired. Please request a new one.'
      case 'already_used':
        return 'This invite has already been used.'
      case 'invalid':
      default:
        return 'Invalid invite link. Please request a new invitation.'
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate passwords
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { user } = await authService.signUpWithInvite(
        inviteDetails.email,
        formData.password,
        inviteDetails.id
      )

      // Redirect based on role
      if (user) {
        const redirectPath = inviteDetails.role === 'student' 
          ? '/student/dashboard'
          : '/teacher/dashboard'
        navigate(redirectPath)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!inviteDetails) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Complete Your Registration</h2>
        
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <p className="text-sm text-blue-600">
            Setting up account for <strong>{inviteDetails.email}</strong> as a{' '}
            <strong>{inviteDetails.role}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full p-2 border rounded bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              className="w-full p-2 border rounded"
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
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
