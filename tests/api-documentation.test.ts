import assert from 'node:assert/strict'
import test from 'node:test'
import { API_DOCUMENTATION, generateOpenApiSpec } from '../lib/api/documentation.ts'

test('generated API docs include core public blog and comment endpoints', () => {
  const spec = generateOpenApiSpec()
  const paths = spec.paths as Record<string, unknown>

  for (const path of [
    '/api/blog/categories/{slug}',
    '/api/blog/tags/{slug}',
    '/api/blog/posts/{slug}/recommendations',
    '/api/comments'
  ]) {
    assert.ok(paths[path], `${path} should be documented`)
  }
})

test('generated API docs describe the comment rate limit accurately', () => {
  const commentPost = API_DOCUMENTATION.find(endpoint =>
    endpoint.path === '/api/comments' && endpoint.method === 'POST'
  )

  assert.equal(commentPost?.rateLimit?.requests, 10)
  assert.equal(commentPost?.rateLimit?.window, '1 minute')
})
