import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseAdminBlogPostRepository } from '../lib/server/adapters/supabase/blog/admin-blog-posts-repository'
import type { SupabaseDataClient } from '../lib/server/adapters/supabase/types'
import {
  getAdminBlogPost,
  listAdminBlogPosts,
  type AdminBlogPostRepository
} from '../lib/server/application/blog/admin-blog-posts'
import { ApplicationError } from '../lib/server/domain/errors'

function repository(): AdminBlogPostRepository {
  return {
    async getSummary() {
      return { totalPosts: 0, publishedPosts: 0, draftPosts: 0, totalViews: 0 }
    },
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

function readRepository(fetch: typeof globalThis.fetch) {
  const client = createClient('http://localhost:54321', 'test-key', {
    global: { fetch },
    auth: { persistSession: false, autoRefreshToken: false }
  })
  return createSupabaseAdminBlogPostRepository(client as unknown as SupabaseDataClient)
}

test('table rows and their exact count use the same search, status and category before pagination', async () => {
  const requests: Request[] = []
  const post = { id: 'oldest', title: 'Post 51' }
  const repo = readRepository(async (input, init) => {
    requests.push(new Request(input, init))
    return Response.json([post], { headers: { 'Content-Range': '50-50/51' } })
  })
  const result = await listAdminBlogPosts(repo, {
    listOnly: true, page: 2, status: 'draft', category: 'engineering', search: '100%_complete (v1)*, "OK"'
  })
  assert.equal(requests.length, 1)
  const params = new URL(requests[0].url).searchParams
  const operand = 'imatch.' + JSON.stringify('100%_complete \\(v1\\)\\*, "OK"')
  assert.equal(params.get('or'), '(title.' + operand + ',excerpt.' + operand + ')')
  assert.equal(params.get('status'), 'eq.draft')
  assert.equal(params.get('category_id'), 'eq.engineering')
  assert.equal(params.get('order'), 'created_at.desc,id.desc')
  assert.equal(params.get('offset'), '50')
  assert.equal(params.get('limit'), '50')
  assert.match(requests[0].headers.get('Prefer') ?? '', /count=exact/)
  assert.deepEqual(result.posts, [post])
  assert.deepEqual(result.pagination, { page: 2, limit: 50, total: 51, totalPages: 2, hasMore: false })
})

test('a removed last page returns the remaining filtered count', async () => {
  const requests: Request[] = []
  const repo = readRepository(async (input, init) => {
    const request = new Request(input, init)
    requests.push(request)
    return request.method === 'HEAD'
      ? new Response(null, { headers: { 'Content-Range': '0-49/50' } })
      : Response.json({ code: 'PGRST103', message: 'Requested range not satisfiable' }, { status: 416 })
  })
  const result = await listAdminBlogPosts(repo, { page: 2, listOnly: true, status: 'draft' })
  assert.equal(requests.length, 2)
  assert.equal(requests[1].method, 'HEAD')
  assert.equal(new URL(requests[1].url).searchParams.get('status'), 'eq.draft')
  assert.deepEqual(result.posts, [])
  assert.equal(result.pagination.total, 50)
  assert.equal(result.pagination.totalPages, 1)
})

test('collection totals include archived posts and continue past the database row cap', async () => {
  const posts = Array.from({ length: 51 }, (_, i) => ({
    id: String(i + 1).padStart(2, '0'),
    status: i === 50 ? 'archived' : i < 25 ? 'draft' : 'published',
    view_count: i === 0 ? null : i + 1
  }))
  const cursors: (string | null)[] = []
  const repo = readRepository(async input => {
    const params = new URL(String(input)).searchParams
    const cursor = params.get('id')
    cursors.push(cursor)
    assert.equal(params.get('select'), 'id,status,view_count')
    assert.equal(params.get('order'), 'id.asc')
    const batch = posts.filter(post => !cursor || post.id > cursor.slice(3)).slice(0, 50)
    return Response.json(batch)
  })
  assert.deepEqual(await repo.getSummary(), { totalPosts: 51, draftPosts: 25, publishedPosts: 25, totalViews: 1325 })
  assert.deepEqual(cursors, [null, 'gt.50', 'gt.51'])
})
