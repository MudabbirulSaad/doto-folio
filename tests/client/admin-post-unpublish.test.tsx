import { Suspense } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import EditPostPage from '@/app/admin/blog/posts/[id]/edit/page'

const { router } = vi.hoisted(() => ({ router: { push: vi.fn() } }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

const post = { id: 'notes', slug: 'notes', title: 'Field notes', content: 'Saved text', status: 'published', tags: [] }

async function openPublishedPost(update: (body: Record<string, unknown>) => Promise<Response>) {
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    if (url !== '/api/admin/blog/posts/notes') return Response.json({ data: [] })
    if (init?.method === 'PUT') return update(JSON.parse(String(init.body)))
    return Response.json({ data: post })
  })
  await act(async () => render(<Suspense><EditPostPage params={Promise.resolve({ id: post.id })} /></Suspense>))
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

it('withdraws only the saved post and retains the working copy even after a failed attempt', async () => {
  const retry = Promise.withResolvers<Response>()
  const update = vi.fn()
    .mockResolvedValueOnce(Response.json({ error: 'Update failed' }, { status: 503 }))
    .mockReturnValueOnce(retry.promise)
  await openPublishedPost(update)
  const title = screen.getByPlaceholderText('Post Title')
  fireEvent.change(title, { target: { value: 'Unsaved title' } })
  fireEvent.click(screen.getByRole('button', { name: 'Move to draft' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Update failed')
  expect(screen.getByRole('status')).toHaveTextContent('Published')

  fireEvent.click(screen.getByRole('button', { name: 'Move to draft' }))
  expect(screen.getByRole('button', { name: 'Moving to draft…' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
  await act(async () => retry.resolve(Response.json({ data: { ...post, status: 'draft' } })))

  expect(update.mock.calls).toEqual([[{ id: post.id, status: 'draft' }], [{ id: post.id, status: 'draft' }]])
  expect(screen.getByRole('status')).toHaveTextContent('Draft')
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled()
  expect(title).toHaveValue('Unsaved title')
  expect(router.push).not.toHaveBeenCalled()
})

it('omits status when saving edits from a tab that still shows Published', async () => {
  const update = vi.fn().mockResolvedValue(Response.json({ data: { ...post, status: 'draft' } }))
  await openPublishedPost(update)
  fireEvent.change(screen.getByPlaceholderText('Post Title'), { target: { value: 'Revised notes' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
  await waitFor(() => expect(router.push).toHaveBeenCalledWith('/admin/blog/posts'))
  expect(update.mock.calls[0][0]).toHaveProperty('title', 'Revised notes')
  expect(update.mock.calls[0][0]).not.toHaveProperty('status')
})
