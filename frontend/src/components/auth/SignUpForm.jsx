import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../../services/auth.service'

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

  // Get invite details from URL parameters
  useEffect(() => {
    const email = searchParams.get('email')
    const role = searchParams.get('role')
    const inviteId = searchParams.get('invite_id')

    if (email && role && inviteId) {
      setInviteDetails({ email, role, inviteId })
      setFormData(prev => ({ ...prev, email }))
    } else {
      setError('Invalid invite link. Please request a new invitation.')
    }
  }, [searchParams])

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
        inviteDetails.inviteId
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
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                password: e.target.value 
              }))}
              className="w-full p-2 border rounded"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                confirmPassword: e.target.value 
              }))}
              className="w-full p-2 border rounded"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  )
}
