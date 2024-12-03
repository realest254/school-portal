import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Temporary mock client for development
export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null })
  }
};
