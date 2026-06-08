import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getAdminDashboard,
  type AdminDashboardRepository
} from '../lib/server/application/admin/dashboard'

const fixedNow = new Date('2026-06-08T12:00:00.000Z')

function repository(): AdminDashboardRepository {
  return {
    async getCounts() {
      return {
        totalComments: 3,
        totalSubmissions: 2,
        totalProjects: 1
      }
    },
    async getPostViewCounts() {
      return [4, null, 6]
    },
    async listRecentComments() {
      return [
        {
          id: 'comment-1',
          user_id: 'user-1',
          content: 'Great post',
          created_at: '2026-06-08T10:00:00.000Z',
          post: { title: 'Hexagonal Refactor', slug: 'hexagonal-refactor' }
        },
        {
          id: 'comment-2',
          user_id: 'missing-user',
          content: 'Second',
          created_at: '2026-06-07T10:00:00.000Z',
          post: { title: 'TDD', slug: 'tdd' }
        }
      ]
    },
    async listRecentSubmissions() {
      return [{ id: 'submission-1', name: 'Ada', created_at: '2026-06-08T09:00:00.000Z' }]
    },
    async listCommentAuthors() {
      return [
        { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com', avatar: 'avatar.png' },
        { id: 'user-2', name: 'Grace Hopper', email: 'grace@example.com' }
      ]
    },
    async listAllCommentUserIds() {
      return ['user-1', 'user-1', 'user-2', 'missing-user']
    },
    async listActivitySince() {
      return {
        views: [
          { created_at: '2026-06-08T02:00:00.000Z' },
          { created_at: '2026-06-08T03:00:00.000Z' }
        ],
        comments: [{ created_at: '2026-06-07T03:00:00.000Z' }]
      }
    }
  }
}

test('getAdminDashboard aggregates stats and enriches activity through ports', async () => {
  const dashboard = await getAdminDashboard(repository(), { now: () => fixedNow })

  assert.deepEqual(dashboard.stats, {
    totalViews: 10,
    totalComments: 3,
    totalSubmissions: 2,
    totalProjects: 1,
    viewsGrowth: 12,
    commentsGrowth: 5
  })

  assert.equal(dashboard.recentComments[0].author_name, 'Ada Lovelace')
  assert.equal(dashboard.recentComments[0].author_email, 'ada@example.com')
  assert.equal(dashboard.recentComments[1].author_name, 'Anonymous')
  assert.deepEqual(dashboard.topCommenters.slice(0, 2), [
    { name: 'Ada Lovelace', email: 'ada@example.com', count: 2 },
    { name: 'Grace Hopper', email: 'grace@example.com', count: 1 }
  ])
  assert.equal(dashboard.activityChartData.length, 30)
  assert.deepEqual(dashboard.activityChartData.at(-1), { date: 'Jun 8', views: 2, comments: 0 })
  assert.deepEqual(dashboard.activityChartData.at(-2), { date: 'Jun 7', views: 0, comments: 1 })
})
