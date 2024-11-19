import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setUserRole(session?.user?.user_metadata?.role ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setUserRole(session?.user?.user_metadata?.role ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // Function for admin to generate invite links
  const generateInviteLink = async (email, role) => {
    if (userRole !== 'admin') {
      return { error: { message: 'Unauthorized. Only admins can generate invites.' } }
    }

    try {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { role },
        redirectTo: `${window.location.origin}/auth/setup-password`,
      })
      
      return { data, error }
    } catch (error) {
      return { error }
    }
  }

  // Function to complete user signup with invite
  const completeSignup = async (email, password) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    })
    return { data, error }
  }

  const value = {
    user,
    userRole,
    loading,
    signInWithEmail,
    signOut,
    generateInviteLink,
    completeSignup,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
