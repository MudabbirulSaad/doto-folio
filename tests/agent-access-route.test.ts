import test from 'node:test'
import assert from 'node:assert/strict'
import { POST } from '../app/api/agent/access-requests/route'

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
