import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { ApplicationError } from '../lib/server/domain/errors'
import { handlePostComment } from '../app/api/comments/route'

type CreateInput = {
  postId: string
  content: string
  userId?: string
  parentId?: string
}

const calls: { token: string; input: CreateInput }[] = []
let createError: Error | null = null

const commentUseCases = {
  async create(token: string, input: CreateInput) {
    if (createError) throw createError
    calls.push({ token, input })
    return { id: 'comment-1', ...input, user_id: 'admin-1' }
  }
}

async function postComment(request: NextRequest) {
  return handlePostComment(request, commentUseCases)
}

function request(body: unknown, token = 'pa_test') {
  return new NextRequest('https://example.com/api/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  })
}

test('POST /api/comments accepts agent comment payloads without userId', async () => {
  calls.length = 0
  createError = null

  const response = await postComment(request({
    postId: '00000000-0000-4000-8000-000000000001',
    content: 'Thanks for the thoughtful post.'
  }))
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(calls[0].token, 'pa_test')
  assert.deepEqual(calls[0].input, {
    postId: '00000000-0000-4000-8000-000000000001',
    content: 'Thanks for the thoughtful post.'
  })
})

test('POST /api/comments accepts agent replies with parentId', async () => {
  calls.length = 0
  createError = null

  const response = await postComment(request({
    postId: '00000000-0000-4000-8000-000000000001',
    parentId: '00000000-0000-4000-8000-000000000002',
    content: 'Replying with more context.'
  }))

  assert.equal(response.status, 200)
  assert.equal(calls[0].input.parentId, '00000000-0000-4000-8000-000000000002')
})

test('POST /api/comments returns forbidden when an agent lacks comments:create', async () => {
  calls.length = 0
  createError = new ApplicationError('FORBIDDEN', 'Agent token is missing required scope: comments:create')

  const response = await postComment(request({
    postId: '00000000-0000-4000-8000-000000000001',
    content: 'Trying without scope.'
  }))
  const body = await response.json()

  assert.equal(response.status, 403)
  assert.equal(body.success, false)
  assert.equal(body.error.code, 'FORBIDDEN')
})
