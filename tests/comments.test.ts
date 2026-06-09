import test from 'node:test'
import assert from 'node:assert/strict'
import { ApplicationError } from '../lib/server/domain/errors'
import {
  createComment,
  listComments,
  type CommentRepository,
  type CommenterAuthenticator
} from '../lib/server/application/comments/comments'

function repository(overrides: Partial<CommentRepository> = {}): CommentRepository {
  return {
    async findCommentsByPost() {
      return [
        { id: 'comment-1', content: 'Hello', created_at: '2026-06-01', user_id: 'user-1', parent_id: null }
      ]
    },
    async findUsersByIds() {
      return new Map([
        ['user-1', { name: 'Ada', email: 'ada@example.com', avatar: 'avatar.png' }]
      ])
    },
    async findPostCommentSettings() {
      return { allow_comments: true }
    },
    async insertComment(data) {
      return { id: 'comment-2', ...data }
    },
    ...overrides
  }
}

test('listComments enriches comment authors through the repository port', async () => {
  const comments = await listComments(repository(), 'post-1')

  assert.deepEqual(comments, [
    {
      id: 'comment-1',
      content: 'Hello',
      created_at: '2026-06-01',
      user_id: 'user-1',
      parent_id: null,
      author: { name: 'Ada', email: 'ada@example.com', avatar: 'avatar.png' }
    }
  ])
})

test('listComments requires a post id', async () => {
  await assert.rejects(
    () => listComments(repository(), ''),
    (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR'
  )
})

test('createComment authenticates the bearer token and checks comment settings', async () => {
  const authenticator: CommenterAuthenticator = {
    async authenticate(token) {
      assert.equal(token, 'token-1')
      return { type: 'user', id: 'user-1' }
    }
  }

  const comment = await createComment(repository(), authenticator, 'token-1', {
    postId: 'post-1',
    userId: 'user-1',
    content: 'Hello',
    parentId: 'parent-1'
  })

  assert.equal(comment.id, 'comment-2')
  assert.equal(comment.parent_id, 'parent-1')
})

test('createComment allows scoped agents to create comments as the source admin', async () => {
  const authenticator: CommenterAuthenticator = {
    async authenticate(token) {
      assert.equal(token, 'agent-token')
      return { type: 'agent', id: 'admin-1' }
    }
  }

  const comment = await createComment(repository(), authenticator, 'agent-token', {
    postId: 'post-1',
    content: 'Thanks for reading'
  })

  assert.equal(comment.user_id, 'admin-1')
  assert.equal(comment.parent_id, null)
})

test('createComment allows scoped agents to reply to comments', async () => {
  const comment = await createComment(repository(), { async authenticate() { return { type: 'agent', id: 'admin-1' } } }, 'agent-token', {
    postId: 'post-1',
    content: 'Good point',
    parentId: 'parent-1'
  })

  assert.equal(comment.user_id, 'admin-1')
  assert.equal(comment.parent_id, 'parent-1')
})

test('createComment rejects invalid sessions, missing posts, and disabled comments', async () => {
  await assert.rejects(
    () => createComment(repository(), { async authenticate() { return null } }, 'bad-token', {
      postId: 'post-1',
      userId: 'user-1',
      content: 'Hello'
    }),
    /Invalid or expired session/
  )

  await assert.rejects(
    () => createComment(repository({ async findPostCommentSettings() { return null } }), { async authenticate() { return { type: 'user', id: 'user-1' } } }, 'token', {
      postId: 'post-1',
      userId: 'user-1',
      content: 'Hello'
    }),
    (error: unknown) => error instanceof ApplicationError && error.details?.includes('Post not found') === true
  )

  await assert.rejects(
    () => createComment(repository({ async findPostCommentSettings() { return { allow_comments: false } } }), { async authenticate() { return { type: 'user', id: 'user-1' } } }, 'token', {
      postId: 'post-1',
      userId: 'user-1',
      content: 'Hello'
    }),
    (error: unknown) => error instanceof ApplicationError && error.details?.includes('Comments are disabled for this post') === true
  )
})

test('createComment keeps human comments tied to the matching session user', async () => {
  await assert.rejects(
    () => createComment(repository(), { async authenticate() { return { type: 'user', id: 'user-1' } } }, 'token', {
      postId: 'post-1',
      content: 'Hello'
    }),
    /Invalid or expired session/
  )

  await assert.rejects(
    () => createComment(repository(), { async authenticate() { return { type: 'user', id: 'user-1' } } }, 'token', {
      postId: 'post-1',
      userId: 'user-2',
      content: 'Hello'
    }),
    /Invalid or expired session/
  )
})
