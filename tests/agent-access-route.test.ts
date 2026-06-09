import test from 'node:test'
import assert from 'node:assert/strict'
import { POST } from '../app/api/agent/access-requests/route'
import { GET as getInstructions } from '../app/api/agent/instructions/route'

test('POST /api/agent/access-requests returns invalid-json for malformed bodies', async () => {
  const response = await POST(new Request('https://example.com/api/agent/access-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{agentName:Codex}'
  }) as any)
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.equal(body.success, false)
  assert.deepEqual(body.error, {
    code: 'INVALID_JSON',
    message: 'Invalid JSON format'
  })
})

test('GET /api/agent/instructions returns unauthorized without bearer token', async () => {
  const response = await getInstructions(new Request('https://example.com/api/agent/instructions') as any)
  const body = await response.json()

  assert.equal(response.status, 401)
  assert.equal(body.success, false)
  assert.equal(body.error.code, 'UNAUTHORIZED')
})
