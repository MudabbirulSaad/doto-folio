import { describe, expect, it, vi } from 'vitest'
import {
  exportAdminContactSubmissions,
  loadAdminContactSubmissions,
  updateAdminContactSubmissionReadStatus,
  type AdminContactSubmissionGateway
} from '@/lib/client/application/admin/contact-submissions'
import type { AdminContactSubmission } from '@/lib/client/domain/contact-submissions'

const filters = {
  search: 'ada',
  readStatus: 'unread',
  timeFilter: 'last7days'
}

const submissionFixture: AdminContactSubmission = {
  id: 'submission-1',
  name: 'Ada',
  email: 'ada@example.com',
  subject: 'Project',
  message: 'Hello there',
  is_read: false,
  read_at: null,
  read_by: null,
  created_at: '2026-06-09T00:00:00.000Z',
  updated_at: '2026-06-09T00:00:00.000Z'
}

describe('admin contact submissions workflow', () => {
  it('loads submissions through the gateway with filters', async () => {
    const gateway: AdminContactSubmissionGateway = {
      list: vi.fn(async () => [submissionFixture]),
      updateReadStatus: vi.fn(),
      export: vi.fn()
    }

    await expect(loadAdminContactSubmissions(gateway, filters)).resolves.toEqual({
      success: true,
      submissions: [submissionFixture]
    })
    expect(gateway.list).toHaveBeenCalledWith(filters)
  })

  it('updates read status and returns the ids to clear selection', async () => {
    const gateway: AdminContactSubmissionGateway = {
      list: vi.fn(),
      updateReadStatus: vi.fn(async () => ({
        updated: 2,
        submissions: [{ id: 'one' }, { id: 'two' }]
      })),
      export: vi.fn()
    }

    await expect(updateAdminContactSubmissionReadStatus(gateway, ['one', 'two'], true)).resolves.toEqual({
      success: true,
      updated: 2,
      submissionIds: ['one', 'two'],
      isRead: true
    })
    expect(gateway.updateReadStatus).toHaveBeenCalledWith(['one', 'two'], true, 'Admin')
  })

  it('exports the filtered submissions through the gateway', async () => {
    const blob = new Blob(['id,name'])
    const gateway: AdminContactSubmissionGateway = {
      list: vi.fn(),
      updateReadStatus: vi.fn(),
      export: vi.fn(async () => ({
        blob,
        filename: 'contact-submissions-2026-06-09.csv'
      }))
    }

    await expect(exportAdminContactSubmissions(gateway, 'csv', filters)).resolves.toEqual({
      success: true,
      blob,
      filename: 'contact-submissions-2026-06-09.csv'
    })
    expect(gateway.export).toHaveBeenCalledWith('csv', filters)
  })

  it('returns workflow errors when the gateway fails', async () => {
    const gateway: AdminContactSubmissionGateway = {
      list: vi.fn(async () => {
        throw new Error('No access')
      }),
      updateReadStatus: vi.fn(),
      export: vi.fn()
    }

    await expect(loadAdminContactSubmissions(gateway, filters)).resolves.toEqual({
      success: false,
      error: 'No access'
    })
  })
})
