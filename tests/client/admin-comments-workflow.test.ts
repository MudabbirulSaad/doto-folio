import { describe, expect, it, vi } from 'vitest'
import {
  deleteAdminComment,
  loadAdminComments,
  replyToAdminComment,
  type AdminCommentGateway
} from '@/lib/client/application/admin/comments'
import type { AdminComment } from '@/lib/client/domain/admin-comments'

const commentFixture: AdminComment = {
  id: 'comment-1',
  content: 'Hello',
  created_at: '2026-06-09T00:00:00.000Z',
  author_name: 'Ada',
  author_email: 'ada@example.com',
  post_id: 'post-1',
  parent_id: null,
  post: {
    title: 'Post',
    slug: 'post'
  }
}

describe('admin comments workflow', () => {
  it('loads comments through the gateway', async () => {
    const gateway: AdminCommentGateway = {
      list: vi.fn(async () => [commentFixture]),
      delete: vi.fn(),
      reply: vi.fn()
    }

    await expect(loadAdminComments(gateway)).resolves.toEqual({
      success: true,
      comments: [commentFixture]
    })
  })

  it('deletes comments through the admin gateway', async () => {
    const gateway: AdminCommentGateway = {
      list: vi.fn(),
      delete: vi.fn(async () => undefined),
      reply: vi.fn()
    }

    await expect(deleteAdminComment(gateway, 'comment-1')).resolves.toEqual({
      success: true,
      id: 'comment-1'
    })
    expect(gateway.delete).toHaveBeenCalledWith('comment-1')
  })

  it('replies to comments only with content and an active session', async () => {
    const gateway: AdminCommentGateway = {
      list: vi.fn(),
      delete: vi.fn(),
      reply: vi.fn(async () => ({ id: 'reply-1' }))
    }
    const comment = { id: 'comment-1', post_id: 'post-1' }
    const session = { accessToken: 'token', userId: 'user-1' }

    await expect(replyToAdminComment(gateway, comment, '  Thanks  ', session)).resolves.toEqual({
      success: true
    })
    expect(gateway.reply).toHaveBeenCalledWith('token', {
      postId: 'post-1',
      parentId: 'comment-1',
      content: 'Thanks',
      userId: 'user-1'
    })

    await expect(replyToAdminComment(gateway, comment, '', session)).resolves.toEqual({
      success: false,
      error: 'Reply is required'
    })
    await expect(replyToAdminComment(gateway, comment, 'Thanks', null)).resolves.toEqual({
      success: false,
      error: 'Please log in to reply'
    })
  })
})
