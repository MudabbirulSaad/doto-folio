import test from 'node:test'
import assert from 'node:assert/strict'
import { POST } from '../app/api/auth/logout/route'

test('POST /api/auth/logout returns shared error envelopes when logout fails', async () => {
  const originalError = console.error
  console.error = () => undefined

  try {
    const response = await POST(new Request('http://localhost:3000/api/auth/logout', { method: 'POST' }))
    const payload = await response.json()

    assert.equal(response.status, 500)
    assert.equal(payload.success, false)
    assert.equal(payload.error.code, 'INTERNAL_ERROR')
  } finally {
    console.error = originalError
  }
})
