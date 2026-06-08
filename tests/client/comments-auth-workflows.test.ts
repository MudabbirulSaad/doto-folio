import { describe, expect, it, vi } from 'vitest'
import { buildCommentTree, countComments, postComment, type CommentGateway } from '@/lib/client/application/comments/comments'
import { requestCommentOtp, verifyCommentOtp, type OtpGateway } from '@/lib/client/application/auth/otp'

describe('comment workflows', () => {
  it('builds and counts nested comment trees', () => {
    const tree = buildCommentTree([
      { id: 'root', parent_id: null, content: 'Root', created_at: '', author: { name: 'Ada' } },
      { id: 'reply', parent_id: 'root', content: 'Reply', created_at: '', author: { name: 'Lin' } }
    ])

    expect(tree).toHaveLength(1)
    expect(tree[0].replies?.[0].id).toBe('reply')
    expect(countComments(tree)).toBe(2)
  })

  it('requires a session token before posting comments', async () => {
    const gateway: CommentGateway = {
      list: vi.fn(),
      create: vi.fn()
    }

    expect(await postComment(gateway, null, { postId: 'post-1', userId: 'user-1', content: 'Hello' })).toEqual({
      success: false,
      error: 'No active session'
    })
    expect(gateway.create).not.toHaveBeenCalled()
  })
})

describe('comment OTP workflows', () => {
  it('normalizes OTP request and verification inputs', async () => {
    const gateway: OtpGateway = {
      request: vi.fn(),
      verify: vi.fn(async () => ({ session: { access_token: 'token' } }))
    }

    expect(await requestCommentOtp(gateway, { email: 'ADA@EXAMPLE.COM ', name: ' Ada ', captchaToken: 'captcha' })).toEqual({
      success: true
    })
    expect(gateway.request).toHaveBeenCalledWith({ email: 'ada@example.com', name: 'Ada', captchaToken: 'captcha' })

    expect(await verifyCommentOtp(gateway, { email: 'ADA@EXAMPLE.COM ', token: ' 123456 ', captchaToken: 'captcha' })).toEqual({
      success: true,
      session: { access_token: 'token' }
    })
  })
})
