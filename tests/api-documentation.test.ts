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

test('generated API docs cover the public portfolio API story', () => {
  const spec = generateOpenApiSpec()
  const paths = spec.paths as Record<string, Record<string, unknown>>

  const publicEndpoints = [
    ['/api/contact', 'post'],
    ['/api/subscribe', 'post'],
    ['/api/health', 'get'],
    ['/api/blog/posts', 'get'],
    ['/api/blog/posts/{slug}', 'get'],
    ['/api/blog/categories', 'get'],
    ['/api/blog/categories/{slug}', 'get'],
    ['/api/blog/tags/{slug}', 'get'],
    ['/api/blog/posts/{slug}/recommendations', 'get'],
    ['/api/comments', 'get'],
    ['/api/comments', 'post'],
  ] as const

  for (const [path, method] of publicEndpoints) {
    assert.ok(paths[path]?.[method], `${method.toUpperCase()} ${path} should be documented`)
  }
})

test('generated API docs describe the comment rate limit accurately', () => {
  const commentPost = API_DOCUMENTATION.find(endpoint =>
    endpoint.path === '/api/comments' && endpoint.method === 'POST'
  )

  assert.equal(commentPost?.rateLimit?.requests, 10)
  assert.equal(commentPost?.rateLimit?.window, '1 minute')
})

test('generated API docs include the agent access request polling endpoint', () => {
  const spec = generateOpenApiSpec()
  const paths = spec.paths as Record<string, Record<string, unknown>>

  assert.ok(paths['/api/agent/access-requests/{code}']?.get)
})

test('generated API docs cover invite-first agent access endpoints', () => {
  const spec = generateOpenApiSpec()
  const paths = spec.paths as Record<string, Record<string, unknown>>

  const agentEndpoints = [
    ['/api/agent/public-context', 'get'],
    ['/api/agent/invitations/claim', 'post'],
    ['/api/agent/access-requests', 'post'],
    ['/api/agent/access-requests/{code}', 'get'],
    ['/api/agent/me', 'get'],
    ['/api/agent/instructions', 'get'],
    ['/api/agent/context', 'get'],
  ] as const

  for (const [path, method] of agentEndpoints) {
    assert.ok(paths[path]?.[method], `${method.toUpperCase()} ${path} should be documented`)
  }
})
