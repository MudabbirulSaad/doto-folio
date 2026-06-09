import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeAuthRedirectPath } from '../lib/auth/redirect'

test('sanitizeAuthRedirectPath allows same-site relative paths', () => {
  assert.equal(sanitizeAuthRedirectPath(null), '/')
  assert.equal(sanitizeAuthRedirectPath('/admin/dashboard'), '/admin/dashboard')
  assert.equal(sanitizeAuthRedirectPath('/blog?tag=security#comments'), '/blog?tag=security#comments')
})

test('sanitizeAuthRedirectPath rejects external and malformed redirects', () => {
  assert.equal(sanitizeAuthRedirectPath('https://evil.example/path'), '/')
  assert.equal(sanitizeAuthRedirectPath('//evil.example/path'), '/')
  assert.equal(sanitizeAuthRedirectPath('%2F%2Fevil.example/path'), '/')
  assert.equal(sanitizeAuthRedirectPath('/\\evil.example'), '/')
  assert.equal(sanitizeAuthRedirectPath('/%5Cevil.example'), '/')
  assert.equal(sanitizeAuthRedirectPath('admin/dashboard'), '/')
  assert.equal(sanitizeAuthRedirectPath('/admin%00/dashboard'), '/')
})
