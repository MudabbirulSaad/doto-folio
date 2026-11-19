import { Suspense, useImperativeHandle, type Ref } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import NewPostPage from '@/app/admin/blog/posts/new/page'
import EditPostPage from '@/app/admin/blog/posts/[id]/edit/page'
import type { NotionEditorHandle } from '@/components/admin/blog/notion-editor'

const { router } = vi.hoisted(() => ({ router: { push: vi.fn() } }))
const readDraft = vi.fn<NotionEditorHandle['readDraft']>()
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('next/dynamic', () => ({
  default: () => function TestEditor({ ref }: { ref: Ref<NotionEditorHandle> }) {
    useImperativeHandle(ref, () => ({ readDraft }))
    return null
  }
}))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

function mockPostReads(content = '', status = 'draft') {
  const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method && init.method !== 'GET') throw new Error('Unexpected write')
    const post = { id: 'post', title: 'Saved title', slug: 'post', content, status, tags: [] }
    return Response.json({ data: url.endsWith('/posts/post') ? post : [] })
  })
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}

it('reads the live new-post editor on each open and ignores a result from a closed preview', async () => {
  const fetcher = mockPostReads()
  const earlier = Promise.withResolvers<Awaited<ReturnType<NotionEditorHandle['readDraft']>>>()
  readDraft.mockReturnValueOnce(earlier.promise).mockResolvedValueOnce({
    blocks: [{ type: 'paragraph', data: { text: 'Latest edit' } }]
  })
  render(<NewPostPage />)
  const preview = screen.getByRole('button', { name: 'Preview' })
  fireEvent.change(screen.getByPlaceholderText('Untitled'), { target: { value: 'Unsaved title' } })
  fireEvent.click(preview)
  fireEvent.click(screen.getByRole('button', { name: 'Close preview' }))
  fireEvent.click(preview)
  const dialog = within(screen.getByRole('dialog', { name: 'Post preview' }))
  expect(await dialog.findByText('Latest edit')).toBeVisible()
  await act(async () => earlier.resolve({ blocks: [{ type: 'paragraph', data: { text: 'Earlier edit' } }] }))
  expect(dialog.queryByText('Earlier edit')).toBeNull()
  expect(dialog.getByRole('heading', { name: 'Unsaved title' })).toBeVisible()
  expect(readDraft).toHaveBeenCalledTimes(2)
  fireEvent.click(dialog.getByRole('button', { name: 'Close preview' }))
  expect(screen.getByRole('combobox')).toHaveTextContent('Draft')
  expect(fetcher.mock.calls.every(([, init]) => (init?.method ?? 'GET') === 'GET')).toBe(true)
  expect(router.push).not.toHaveBeenCalled()
})

it('previews unsaved Markdown on the edit screen and preserves the published record', async () => {
  const fetcher = mockPostReads('Saved paragraph', 'published')
  await act(async () => render(<Suspense><EditPostPage params={Promise.resolve({ id: 'post' })} /></Suspense>))
  fireEvent.click(screen.getByText('Edit Markdown source'))
  const source = screen.getByRole('textbox', { name: 'Markdown source' })
  fireEvent.change(source, { target: { value: '## Revised heading\n\nRevised body' } })
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
  const dialog = within(screen.getByRole('dialog', { name: 'Post preview' }))
  expect(await dialog.findByRole('heading', { name: 'Revised heading' })).toBeVisible()
  expect(dialog.getByText('Revised body')).toBeVisible()
  expect(dialog.queryByText('Saved paragraph')).toBeNull()
  fireEvent.click(dialog.getByRole('button', { name: 'Close preview' }))
  expect(source).toHaveValue('## Revised heading\n\nRevised body')
  expect(screen.getByText('Published', { exact: true })).toBeVisible()
  expect(readDraft).not.toHaveBeenCalled()
  expect(fetcher.mock.calls.every(([, init]) => (init?.method ?? 'GET') === 'GET')).toBe(true)
  expect(router.push).not.toHaveBeenCalled()
})
