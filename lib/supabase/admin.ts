import { createClient } from '@supabase/supabase-js'
import type { SupabaseAdminDataClient } from '@/lib/server/adapters/supabase/types'

/**
 * Admin Supabase client with service role key
 * This client bypasses Row Level Security (RLS) and should only be used server-side
 * for administrative operations like contact form submissions.
 * 
 * NEVER use this client in client-side code or expose the service role key!
 */
export function createAdminClient(): SupabaseAdminDataClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    )
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }) as unknown as SupabaseAdminDataClient
}
