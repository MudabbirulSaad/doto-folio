import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { GET, POST } from '../app/api/admin/content/contact/route'

function adminContactContentRequest(method: 'GET' | 'POST') {
  return new NextRequest('http://localhost:3000/api/admin/content/contact', {
    method,
    headers: {
      'content-type': 'application/json',
      'user-agent': `admin-contact-content-${method.toLowerCase()}`
    },
    body: method === 'POST' ? JSON.stringify({ type: 'contact_method' }) : undefined
  })
}

test('admin contact content API returns shared unauthorized envelopes', async () => {
  const originalError = console.error
  console.error = () => undefined

  try {
    const getResponse = await GET(adminContactContentRequest('GET'))
    const getPayload = await getResponse.json()

    assert.equal(getResponse.status, 401)
    assert.equal(getPayload.success, false)
    assert.equal(getPayload.error.code, 'UNAUTHORIZED')

    const postResponse = await POST(adminContactContentRequest('POST'))
    const postPayload = await postResponse.json()

    assert.equal(postResponse.status, 401)
    assert.equal(postPayload.success, false)
    assert.equal(postPayload.error.code, 'UNAUTHORIZED')
  } finally {
    console.error = originalError
  }
})
