import test from 'node:test'
import assert from 'node:assert/strict'
import {
  listAdminComments,
  type AdminCommentRepository
} from '../lib/server/application/comments/admin-comments'
import { signOutCurrentSession, type SessionAuthPort } from '../lib/server/application/auth/logout'

function repository(): AdminCommentRepository {
  return {
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
