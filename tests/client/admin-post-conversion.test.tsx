import { Suspense, useImperativeHandle, type Ref } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import EditPostPage from '@/app/admin/blog/posts/[id]/edit/page'
import type { NotionEditorHandle } from '@/components/admin/blog/notion-editor'

const { router } = vi.hoisted(() => ({ router: { push: vi.fn() } }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
const readDraft = vi.fn<NotionEditorHandle['readDraft']>()
vi.mock('next/dynamic', () => ({
  default: () => function TestEditor({ ref }: { ref: Ref<NotionEditorHandle> }) {
    useImperativeHandle(ref, () => ({ readDraft }))
    return null
  }
}))

afterEach(() => vi.unstubAllGlobals())

it('keeps the entire edited Markdown source when conversion is blocked or cancelled', async () => {
  const post = { id: 'legacy', title: 'Notes', slug: 'notes', content: 'Old text', status: 'draft', tags: [] }
  const fetcher = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async url => Response.json({
    data: url.endsWith('/posts/legacy') ? post : []
  }))
  vi.stubGlobal('fetch', fetcher)
  await act(async () => render(<Suspense><EditPostPage params={Promise.resolve({ id: post.id })} /></Suspense>))
  fireEvent.click(screen.getByText('Edit Markdown source'))
  const input = screen.getByRole('textbox', { name: 'Markdown source' })
  const convert = screen.getByRole('button', { name: 'Convert Markdown' })
  const unsupported = '## Unsaved heading\n\n| Name |\n| --- |\n| Unsaved value |'
  fireEvent.change(input, { target: { value: unsupported } })
  fireEvent.click(convert)
  let dialog = within(await screen.findByRole('dialog'))
  expect(await dialog.findByText(/cannot convert table on line 3/)).toBeVisible()
  expect(dialog.queryByRole('button', { name: 'Apply conversion' })).toBeNull()
  fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }))
  expect(input).toHaveValue(unsupported)

  const supported = '## Unsaved heading\n\nNew paragraph'
  fireEvent.change(input, { target: { value: supported } })
  fireEvent.click(convert)
  dialog = within(await screen.findByRole('dialog'))
  expect(await dialog.findByRole('button', { name: 'Apply conversion' })).toBeEnabled()
  fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }))
  expect(input).toHaveValue(supported)
  expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(0)
})

it('reads live blocks again when saving immediately after cancelling a blocked conversion', async () => {
  const liveDraft = { blocks: [{ type: 'paragraph', data: { text: 'Unsaved ![diagram](about:blank)' } }] }
  readDraft.mockResolvedValue(liveDraft)
  const post = { id: 'rich', title: 'Notes', slug: 'notes', status: 'draft', tags: [],
    content: JSON.stringify({ blocks: [{ type: 'paragraph', data: { text: 'Previously saved' } }] }) }
  const updates: { content: string }[] = []
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    if (init?.method === 'PUT') updates.push(JSON.parse(String(init.body)))
    return Response.json({ data: url.endsWith('/posts/rich') ? post : [] })
  })
  await act(async () => render(<Suspense><EditPostPage params={Promise.resolve({ id: post.id })} /></Suspense>))
  fireEvent.click(screen.getByRole('button', { name: 'Convert Markdown' }))
  expect(await screen.findByText(/cannot convert this image URL/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(updates).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
  await waitFor(() => expect(updates).toHaveLength(1))
  expect(JSON.parse(updates[0].content)).toEqual(liveDraft)
})
