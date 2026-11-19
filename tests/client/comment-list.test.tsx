import { act, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CommentList } from '@/components/blog/comments/comment-list'
import type { ClientComment } from '@/lib/client/domain/comments'

const { list } = vi.hoisted(() => ({ list: vi.fn() }))

vi.mock('@/lib/client/adapters/http/comments-api', () => ({
  createCommentApiGateway: () => ({ list })
}))

it('keeps the successful refresh when an older comment request fails later', async () => {
  const firstLoad = Promise.withResolvers<ClientComment[]>()
  list.mockReturnValueOnce(firstLoad.promise)
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce([])

  const props = { postId: 'post', onReplyPosted: vi.fn() }
  const { rerender } = render(<CommentList {...props} refreshTrigger={0} />)
  rerender(<CommentList {...props} refreshTrigger={1} />)
  expect(await screen.findByText('Failed to load comments')).toBeVisible()

  rerender(<CommentList {...props} refreshTrigger={2} />)
  expect(await screen.findByText(/No comments yet/)).toBeVisible()

  await act(async () => { firstLoad.reject(new Error('Previous request failed')) })
  expect(screen.queryByText('Failed to load comments')).not.toBeInTheDocument()
  expect(screen.getByText(/No comments yet/)).toBeVisible()
})
