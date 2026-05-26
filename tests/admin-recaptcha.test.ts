import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { POST } from '../app/api/admin/auth/verify-recaptcha/route'

test('admin reCAPTCHA verifier accepts current v3 token lengths', async () => {
  const originalFetch = global.fetch
  const originalSecret = process.env.RECAPTCHA_SECRET_KEY

  process.env.RECAPTCHA_SECRET_KEY = 'test-secret'
  global.fetch = (async () => new Response(JSON.stringify({
    success: true,
    score: 0.9
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })) as typeof fetch

  try {
    const token = 'a'.repeat(2041)
    const request = new NextRequest('http://localhost:3000/api/admin/auth/verify-recaptcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `recaptcha-test-${Date.now()}`
      },
      body: JSON.stringify({ token })
    })

    const response = await POST(request)
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.success, true)
    assert.equal(body.data.verified, true)
  } finally {
    global.fetch = originalFetch
    if (originalSecret === undefined) {
      delete process.env.RECAPTCHA_SECRET_KEY
    } else {
      process.env.RECAPTCHA_SECRET_KEY = originalSecret
    }
  }
})
