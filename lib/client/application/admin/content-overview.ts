import type { AdminContentOverviewStats } from '@/lib/client/domain/admin-overview'

export interface AdminContentOverviewGateway {
  getOverview(): Promise<AdminContentOverviewStats>
}

export async function loadAdminContentOverview(gateway: AdminContentOverviewGateway) {
  try {
    const stats = await gateway.getOverview()
    return { success: true as const, stats }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to load content overview'
    }
  }
}
