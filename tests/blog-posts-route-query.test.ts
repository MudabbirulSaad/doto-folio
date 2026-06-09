import test from 'node:test'
import assert from 'node:assert/strict'
import { parseBlogPostSearchParams } from '../app/api/blog/posts/route'

test('parseBlogPostSearchParams defaults invalid sort inputs', () => {
  const params = parseBlogPostSearchParams(new URL('https://example.com/api/blog/posts?sortBy=bad&sortOrder=sideways&page=2&limit=99').searchParams)

  assert.equal(params.sortBy, 'published_at')
  assert.equal(params.sortOrder, 'desc')
  assert.equal(params.page, 2)
  assert.equal(params.limit, 50)
})

test('parseBlogPostSearchParams accepts supported sort inputs', () => {
  const params = parseBlogPostSearchParams(new URL('https://example.com/api/blog/posts?sortBy=view_count&sortOrder=asc').searchParams)

  assert.equal(params.sortBy, 'view_count')
  assert.equal(params.sortOrder, 'asc')
})
