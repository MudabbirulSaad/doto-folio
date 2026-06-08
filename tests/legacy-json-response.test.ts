import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createLegacyJsonErrorResponse,
  createLegacyUnauthorizedResponse
} from '../lib/server/adapters/http/legacy-json-response'
import { ApplicationError } from '../lib/server/domain/errors'

test('legacy json responses preserve route-compatible error bodies and statuses', async () => {
  const validation = createLegacyJsonErrorResponse(new ApplicationError('VALIDATION_ERROR', 'Bad input'))
  assert.equal(validation.status, 400)
  assert.deepEqual(await validation.json(), { error: 'Bad input' })

  const missing = createLegacyJsonErrorResponse(new ApplicationError('NOT_FOUND', 'Missing'))
  assert.equal(missing.status, 404)
  assert.deepEqual(await missing.json(), { error: 'Missing' })

  const internal = createLegacyJsonErrorResponse(new Error('boom'))
  assert.equal(internal.status, 500)
  assert.deepEqual(await internal.json(), { error: 'Internal server error' })

  const unauthorized = createLegacyUnauthorizedResponse()
  assert.equal(unauthorized.status, 401)
  assert.deepEqual(await unauthorized.json(), { error: 'Unauthorized' })
})
