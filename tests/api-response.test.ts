import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createInvalidJsonResponse,
  createUnauthorizedResponse,
  createNotFoundResponse,
  createRateLimitResponse,
  createInternalErrorResponse,
  createErrorResponse
} from '../lib/api/response'
import { ApplicationError } from '../lib/server/domain/errors'
import {
  createApplicationErrorResponse,
  createApplicationOrInternalErrorResponse
} from '../lib/server/adapters/http/errors'

async function readJson<T = Record<string, unknown>>(response: Response) {
  return response.json() as Promise<T>
}

interface ErrorBody {
  error: {
    code: string
    message: string
    details?: string[]
  }
}

test('createSuccessResponse returns the shared success envelope', async () => {
  const response = createSuccessResponse({ id: 'post-1' }, 'Loaded')
  const body = await readJson(response)

  assert.equal(response.status, 200)
  assert.deepEqual(body, {
    success: true,
    data: { id: 'post-1' },
    message: 'Loaded'
  })
})

test('createSuccessResponse supports created responses without changing the envelope', async () => {
  const response = createSuccessResponse({ id: 'post-1' }, 201)
  const body = await readJson(response)

  assert.equal(response.status, 201)
  assert.deepEqual(body, {
    success: true,
    data: { id: 'post-1' }
  })
})

test('createValidationErrorResponse accepts a single validation message', async () => {
  const response = createValidationErrorResponse('Name is required')
  const body = await readJson(response)

  assert.equal(response.status, 400)
  assert.equal(body.success, false)
  assert.deepEqual(body.error, {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: ['Name is required']
  })
  assert.match(body.requestId as string, /^req_/)
})

test('createInvalidJsonResponse reports malformed JSON as a client error', async () => {
  const response = createInvalidJsonResponse()
  const body = await readJson(response)

  assert.equal(response.status, 400)
  assert.deepEqual(body.error, {
    code: 'INVALID_JSON',
    message: 'Invalid JSON format'
  })
})

test('auth, not-found, rate-limit, and internal errors use the shared error envelope', async () => {
  const unauthorized = await readJson<ErrorBody>(createUnauthorizedResponse('Missing token'))
  const notFound = await readJson<ErrorBody>(createNotFoundResponse('Post not found'))
  const rateLimitedResponse = createRateLimitResponse({
    success: false,
    limit: 10,
    remaining: 0,
    resetTime: Date.now() + 1000,
    retryAfter: 30
  })
  const rateLimited = await readJson<ErrorBody>(rateLimitedResponse)
  const internal = await readJson<ErrorBody>(createInternalErrorResponse('Failed to load', ['Database unavailable']))

  assert.equal(unauthorized.error?.code, 'UNAUTHORIZED')
  assert.equal(unauthorized.error?.message, 'Missing token')
  assert.equal(notFound.error?.code, 'NOT_FOUND')
  assert.equal(notFound.error?.message, 'Post not found')
  assert.equal(rateLimitedResponse.status, 429)
  assert.deepEqual(rateLimited.error, {
    code: 'RATE_LIMITED',
    message: 'Too many requests',
    details: ['Try again in 30 seconds']
  })
  assert.equal(internal.error?.code, 'INTERNAL_ERROR')
  assert.deepEqual(internal.error?.details, ['Database unavailable'])
})

test('createErrorResponse keeps the legacy message/status call shape', async () => {
  const response = createErrorResponse('Category not found', 404)
  const body = await readJson(response)

  assert.equal(response.status, 404)
  assert.deepEqual(body.error, {
    code: 'NOT_FOUND',
    message: 'Category not found'
  })
})

test('createApplicationErrorResponse maps application errors to the shared envelope', async () => {
  const response = createApplicationErrorResponse(
    new ApplicationError('VALIDATION_ERROR', 'Validation failed', ['Title is required'])
  )
  const body = await readJson(response)

  assert.equal(response.status, 400)
  assert.deepEqual(body.error, {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: ['Title is required']
  })
})

test('createApplicationOrInternalErrorResponse falls back to named internal errors', async () => {
  const validation = createApplicationOrInternalErrorResponse(
    new ApplicationError('VALIDATION_ERROR', 'Validation failed', ['Title is required']),
    'Failed to save'
  )
  assert.equal(validation.status, 400)

  const internal = createApplicationOrInternalErrorResponse(new Error('Database unavailable'), 'Failed to save')
  const body = await readJson<ErrorBody>(internal)

  assert.equal(internal.status, 500)
  assert.deepEqual(body.error, {
    code: 'INTERNAL_ERROR',
    message: 'Failed to save',
    details: ['Database unavailable']
  })
})
