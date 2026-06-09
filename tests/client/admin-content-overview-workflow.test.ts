import { describe, expect, it, vi } from 'vitest'
import {
  loadAdminContentOverview,
  type AdminContentOverviewGateway
} from '@/lib/client/application/admin/content-overview'

describe('admin content overview workflow', () => {
  it('loads dashboard stats through the gateway', async () => {
    const gateway: AdminContentOverviewGateway = {
      getOverview: vi.fn(async () => ({
        projectsCount: 1,
        skillsCount: 2,
        contactMethodsCount: 3,
        socialLinksCount: 4,
        isContentPublished: true,
        commentsCount: 5
      }))
    }

    const result = await loadAdminContentOverview(gateway)

    expect(result).toEqual({
      success: true,
      stats: {
        projectsCount: 1,
        skillsCount: 2,
        contactMethodsCount: 3,
        socialLinksCount: 4,
        isContentPublished: true,
        commentsCount: 5
      }
    })
  })

  it('returns a workflow error when the gateway fails', async () => {
    const gateway: AdminContentOverviewGateway = {
      getOverview: vi.fn(async () => {
        throw new Error('No access')
      })
    }

    await expect(loadAdminContentOverview(gateway)).resolves.toEqual({
      success: false,
      error: 'No access'
    })
  })
})
