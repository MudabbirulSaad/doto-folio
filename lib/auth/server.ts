import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Server-side function to get current admin user
 */
export async function getCurrentAdminUser() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting current admin user:', error)
    return null
  }
}

/**
 * Server-side function to require admin authentication
 * Redirects to login if not authenticated
 */
export async function requireAdminAuth() {
  const user = await getCurrentAdminUser()
  
  if (!user) {
    redirect('/admin/login')
  }
  
  return user
}
