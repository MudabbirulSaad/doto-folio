import test from 'node:test'
import assert from 'node:assert/strict'
import {
  exportContactSubmissions,
  listContactSubmissions,
  updateContactSubmissionReadStatus,
  type ContactSubmissionAdminRepository,
  type ContactSubmissionReadStatusUpdate
} from '../lib/server/application/contact/admin-submissions'
import { ApplicationError } from '../lib/server/domain/errors'

interface CapturedReadStatusUpdate {
  submissionIds: string[]
  data: ContactSubmissionReadStatusUpdate
}

function repository(): ContactSubmissionAdminRepository & { updated: CapturedReadStatusUpdate | null } {
  return {
    updated: null,
    async listSubmissions(filters) {
      assert.equal(filters.search, 'ada')
      assert.equal(filters.readStatus, 'unread')
      return [{
        id: 'submission-1',
        name: 'Ada',
        email: 'ada@example.com',
        subject: 'Project',
        message: 'Hello',
        created_at: '2026-06-08T00:00:00.000Z',
        updated_at: '2026-06-08T00:00:00.000Z',
        is_read: false,
        read_at: null,
        read_by: null
      }]
    },
    async updateReadStatus(submissionIds, data) {
      this.updated = { submissionIds, data }
      return [{
        id: submissionIds[0],
        name: 'Ada',
        email: 'ada@example.com',
        subject: 'Project',
        message: 'Hello',
        created_at: '2026-06-08T00:00:00.000Z',
        ...data
      }]
    }
  }
}

test('listContactSubmissions delegates normalized filters to the repository', async () => {
  const submissions = await listContactSubmissions(repository(), {
    search: 'ada',
    readStatus: 'unread',
    timeFilter: 'all'
  })

  assert.equal(submissions[0].id, 'submission-1')
  assert.equal(submissions[0].name, 'Ada')
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
  assert.deepEqual(repo.updated?.data, {
    is_read: true,
    updated_at: '2026-06-08T00:00:00.000Z',
    read_at: '2026-06-08T00:00:00.000Z',
    read_by: 'admin@example.com'
  })
})

test('exportContactSubmissions formats CSV, JSON, and escaped HTML downloads', () => {
  const submissions = [{
    id: 'submission-1',
    name: 'Ada "Lovelace"',
    email: 'ada@example.com',
    subject: 'Hello <team>',
    message: 'Line one\nLine <two>',
    created_at: '2026-06-08T00:00:00.000Z',
    updated_at: '2026-06-08T01:00:00.000Z',
    is_read: true,
    read_at: '2026-06-08T02:00:00.000Z',
    read_by: 'admin@example.com'
  }]

  const csv = exportContactSubmissions(submissions, 'csv', {
    now: () => new Date('2026-06-09T00:00:00.000Z')
  })

  assert.equal(csv.contentType, 'text/csv')
  assert.equal(csv.filename, 'contact-submissions-2026-06-09.csv')
  assert.match(csv.body, /"Ada ""Lovelace"""/)
  assert.match(csv.body, /"Line one\nLine <two>"/)

  const json = exportContactSubmissions(submissions, 'json', {
    now: () => new Date('2026-06-09T00:00:00.000Z')
  })

  assert.equal(json.contentType, 'application/json')
  assert.equal(json.filename, 'contact-submissions-2026-06-09.json')
  assert.deepEqual(JSON.parse(json.body), submissions)

  const html = exportContactSubmissions(submissions, 'html', {
    now: () => new Date('2026-06-09T00:00:00.000Z')
  })

  assert.equal(html.contentType, 'text/html')
  assert.equal(html.filename, 'contact-submissions-2026-06-09.html')
  assert.match(html.body, /Ada &quot;Lovelace&quot;/)
  assert.match(html.body, /Hello &lt;team&gt;/)
  assert.match(html.body, /Line &lt;two&gt;/)
  assert.doesNotMatch(html.body, /Line <two>/)
})

test('exportContactSubmissions rejects unsupported formats', () => {
  assert.throws(
    () => exportContactSubmissions([], 'pdf'),
    (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR'
  )
})
