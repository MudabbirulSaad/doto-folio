import test from 'node:test'
import assert from 'node:assert/strict'
import {
  deleteAdminComment,
  listAdminComments,
  type AdminCommentRepository
} from '../lib/server/application/comments/admin-comments'
import { ApplicationError } from '../lib/server/domain/errors'
import { signOutCurrentSession, type SessionAuthPort } from '../lib/server/application/auth/logout'

interface TestAdminCommentRepository extends AdminCommentRepository {
  deletedId: string | null
}

function repository(): TestAdminCommentRepository {
  return {
    deletedId: null,
    async listCommentsWithPosts() {
      return [
        { id: 'comment-1', user_id: 'user-1', content: 'Hello', post: { title: 'Post', slug: 'post' } },
        { id: 'comment-2', user_id: 'missing-user', content: 'Hi', post: { title: 'Post', slug: 'post' } }
      ]
    },
    async listUsers() {
      return new Map([
        ['user-1', { name: 'Ada', email: 'ada@example.com', avatar: 'avatar.png' }]
      ])
    },
    async deleteComment(id: string) {
      this.deletedId = id
    }
  }
}

test('listAdminComments enriches authors and falls back for missing users', async () => {
  const comments = await listAdminComments(repository())

  assert.equal(comments[0].author_name, 'Ada')
  assert.equal(comments[0].author_email, 'ada@example.com')
  assert.equal(comments[1].author_name, 'Anonymous')
  assert.equal(comments[1].author_email, 'No Email')
})

test('deleteAdminComment validates and deletes a comment through the repository', async () => {
  await assert.rejects(
    () => deleteAdminComment(repository(), ''),
    (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR'
  )

  const repo = repository()
  const result = await deleteAdminComment(repo, 'comment-1')

  assert.deepEqual(result, { success: true })
  assert.equal(repo.deletedId, 'comment-1')
})

test('signOutCurrentSession delegates to the auth port', async () => {
  let called = false
  const auth: SessionAuthPort = {
    async signOut() {
      called = true
    }
  }

  const result = await signOutCurrentSession(auth)

  assert.equal(called, true)
  assert.deepEqual(result, { success: true })
})
