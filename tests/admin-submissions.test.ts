import test from 'node:test'
import assert from 'node:assert/strict'
import {
  listContactSubmissions,
  updateContactSubmissionReadStatus,
  type ContactSubmissionAdminRepository
} from '../lib/server/application/contact/admin-submissions'
import { ApplicationError } from '../lib/server/domain/errors'

function repository(): ContactSubmissionAdminRepository & { updated: unknown | null } {
  return {
    updated: null,
    async listSubmissions(filters) {
      assert.equal(filters.search, 'ada')
      assert.equal(filters.readStatus, 'unread')
      return [{ id: 'submission-1', name: 'Ada' }]
    },
    async updateReadStatus(submissionIds, data) {
      this.updated = { submissionIds, data }
      return [{ id: submissionIds[0], ...data }]
    }
  }
}

test('listContactSubmissions delegates normalized filters to the repository', async () => {
  const submissions = await listContactSubmissions(repository(), {
    search: 'ada',
    readStatus: 'unread',
    timeFilter: 'all'
  })

  assert.deepEqual(submissions, [{ id: 'submission-1', name: 'Ada' }])
})

test('updateContactSubmissionReadStatus validates ids and sets read metadata', async () => {
  await assert.rejects(
    () => updateContactSubmissionReadStatus(repository(), { submissionIds: null, isRead: true }),
    (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR'
  )

  const repo = repository()
  const result = await updateContactSubmissionReadStatus(repo, {
    submissionIds: ['submission-1'],
    isRead: true,
    readBy: 'admin@example.com'
  }, {
    now: () => new Date('2026-06-08T00:00:00.000Z')
  })

  assert.equal(result.updated, 1)
  assert.deepEqual((repo.updated as any).data, {
    is_read: true,
    updated_at: '2026-06-08T00:00:00.000Z',
    read_at: '2026-06-08T00:00:00.000Z',
    read_by: 'admin@example.com'
  })
})
