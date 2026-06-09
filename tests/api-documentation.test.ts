import assert from 'node:assert/strict'
import test from 'node:test'
import { generateOpenApiSpec } from '../lib/api/documentation.ts'

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
