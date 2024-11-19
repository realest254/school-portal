import { useState } from 'react'
import { authService } from '../../services/auth.service'

export function InviteUsers() {
  // State for single invite
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // State for bulk invite
  const [bulkEmails, setBulkEmails] = useState('')
  const [bulkRole, setBulkRole] = useState('student')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkError, setBulkError] = useState(null)
  const [bulkSuccess, setBulkSuccess] = useState(null)

  // Handle single invite
  const handleSingleInvite = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await authService.generateInvite(email.trim(), role)
      setSuccess('Invitation sent successfully!')
      setEmail('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle bulk invite
  const handleBulkInvite = async (e) => {
    e.preventDefault()
    setBulkLoading(true)
    setBulkError(null)
    setBulkSuccess(null)

    try {
      // Parse emails (assuming comma-separated)
      const emails = bulkEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email) // Remove empty strings

      // Validate emails
      const invalidEmails = emails.filter(email => !isValidEmail(email))
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid emails: ${invalidEmails.join(', ')}`)
      }

      // Create users array for bulk invite
      const users = emails.map(email => ({
        email,
        role: bulkRole
      }))

      await authService.generateBulkInvites(users)
      setBulkSuccess(`Successfully sent ${emails.length} invitations!`)
      setBulkEmails('')
    } catch (err) {
      setBulkError(err.message)
    } finally {
      setBulkLoading(false)
    }
  }

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Invite Users</h2>

      {/* Single Invite Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Single Invite</h3>
        <form onSubmit={handleSingleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-500 text-sm">{success}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </div>

      {/* Bulk Invite Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Bulk Invite</h3>
        <form onSubmit={handleBulkInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Emails (comma-separated)
            </label>
            <textarea
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              className="w-full p-2 border rounded h-32"
              placeholder="email1@example.com, email2@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          {bulkError && <div className="text-red-500 text-sm">{bulkError}</div>}
          {bulkSuccess && (
            <div className="text-green-500 text-sm">{bulkSuccess}</div>
          )}
          <button
            type="submit"
            disabled={bulkLoading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {bulkLoading ? 'Sending...' : 'Send Bulk Invites'}
          </button>
        </form>
      </div>
    </div>
  )
}
