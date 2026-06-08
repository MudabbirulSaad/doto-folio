import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getAdminDashboard } from '@/lib/server/application/admin/dashboard'
import { createSupabaseAdminDashboardRepository } from '@/lib/server/adapters/supabase/admin/dashboard-repository'

export async function createAdminDashboardUseCase() {
  const repository = createSupabaseAdminDashboardRepository(await createClient(), createAdminClient())

  return () => getAdminDashboard(repository)
}
