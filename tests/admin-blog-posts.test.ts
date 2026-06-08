import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getAdminBlogPost,
  listAdminBlogPosts,
  type AdminBlogPostRepository
} from '../lib/server/application/blog/admin-blog-posts'
import { ApplicationError } from '../lib/server/domain/errors'

function repository(): AdminBlogPostRepository {
  return {
    async listPosts(params) {
      assert.equal(params.page, 2)
      assert.equal(params.limit, 10)
      assert.equal(params.status, 'published')
      return {
        posts: [{ id: 'post-1', title: 'Post' }],
        total: 21
      }
    },
    async findPostById(id) {
      return id === 'post-1' ? { id, title: 'Post' } : null
    }
  }
}

test('listAdminBlogPosts normalizes pagination and returns totals', async () => {
  const result = await listAdminBlogPosts(repository(), {
    page: 2,
    limit: 10,
    status: 'published',
    category: 'all'
  })

  assert.deepEqual(result.posts, [{ id: 'post-1', title: 'Post' }])
  assert.deepEqual(result.pagination, {
    page: 2,
    limit: 10,
    total: 21,
    totalPages: 3,
    hasMore: true
  })
})

test('getAdminBlogPost throws not found for missing posts', async () => {
  await assert.rejects(
    () => getAdminBlogPost(repository(), 'missing'),
    (error: unknown) => error instanceof ApplicationError && error.code === 'NOT_FOUND'
  )
})
