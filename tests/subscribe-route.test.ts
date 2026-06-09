import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { GET, POST } from '../app/api/subscribe/route'

function subscribeRequest(body: string, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/subscribe', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'subscribe-route-test',
      ...headers
    },
    body
  })
}

test('POST /api/subscribe rejects invalid JSON and invalid emails', async () => {
  const invalidJson = await POST(subscribeRequest('{', { 'user-agent': 'subscribe-invalid-json' }))
  assert.equal(invalidJson.status, 400)
  assert.equal((await invalidJson.json()).error.code, 'VALIDATION_ERROR')

  const invalidEmail = await POST(subscribeRequest(
    JSON.stringify({ name: 'Ada', email: 'not-an-email' }),
    { 'user-agent': 'subscribe-invalid-email' }
  ))
  assert.equal(invalidEmail.status, 400)
  assert.equal((await invalidEmail.json()).error.code, 'VALIDATION_ERROR')
})

test('POST /api/subscribe rejects oversized requests before persistence', async () => {
  const response = await POST(subscribeRequest(
    JSON.stringify({ email: 'ada@example.com' }),
    {
      'content-length': `${1024 * 1024 + 1}`,
      'user-agent': 'subscribe-oversized'
    }
  ))

  assert.equal(response.status, 400)
  assert.equal((await response.json()).error.code, 'VALIDATION_ERROR')
})

test('POST /api/subscribe rate limits repeated attempts', async () => {
  const headers = { 'user-agent': 'subscribe-rate-limit' }

  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await POST(subscribeRequest('{', headers))
    assert.equal(response.status, 400)
  }

  const limited = await POST(subscribeRequest('{', headers))
  assert.equal(limited.status, 429)
  assert.equal((await limited.json()).error.code, 'RATE_LIMITED')
})

test('GET /api/subscribe returns the shared method-not-allowed envelope', async () => {
  const response = await GET()
  const payload = await response.json()

  assert.equal(response.status, 405)
  assert.equal(payload.success, false)
  assert.equal(payload.error.code, 'METHOD_NOT_ALLOWED')
  assert.equal(payload.error.message, 'Method not allowed')
})
