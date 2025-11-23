import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface AdminLoginData {
  email: string
  password: string
}

export interface AdminAuthResult {
  success: boolean
  error?: string
  user?: User
}

/**
 * Client-side admin login
 */
export async function loginAdmin(credentials: AdminLoginData): Promise<AdminAuthResult> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Login failed - no user data received'
      }
    }

    return {
      success: true,
      user: data.user
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Client-side admin logout
 */
export async function logoutAdmin(): Promise<AdminAuthResult> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.signOut()

    // Also call server-side logout to ensure cookies are cleared
    await fetch('/api/auth/logout', {
      method: 'POST',
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

// Server-side functions moved to separate file to avoid client/server conflicts

/**
 * Check if user is authenticated (for client-side use)
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch {
    return false
  }
}

/**
 * Get current user session (for client-side use)
 */
export async function getCurrentSession() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch {
    return null
  }
}
