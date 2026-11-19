import { Suspense } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import EditPostPage from '@/app/admin/blog/posts/[id]/edit/page'

const { router } = vi.hoisted(() => ({ router: { push: vi.fn() } }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

async function openEditor() {
  const updates: Record<string, unknown>[] = []
  const category = { id: 'systems', name: 'Systems', color: '#123456' }
  const post = {
    id: 'notes', title: 'Field notes', slug: 'notes', content: 'Article text', status: 'published',
    category_id: category.id, meta_title: 'Search title', meta_description: 'Search description'
  }
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    if (init?.method === 'PUT') updates.push(JSON.parse(String(init.body)))
    if (url.endsWith('/posts/notes')) return Response.json({ data: post })
    return Response.json({ data: url.endsWith('/categories') ? [category] : [] })
  })
  await act(async () => render(<Suspense><EditPostPage params={Promise.resolve({ id: post.id })} /></Suspense>))
  fireEvent.click(screen.getByRole('button', { name: 'SEO Settings' }))
  return updates
}

it('sends explicit clears for an assigned category and both SEO overrides', async () => {
  const updates = await openEditor()
  const category = screen.getByRole('combobox', { name: 'Category' })
  expect(category).toHaveTextContent('Systems')
  HTMLElement.prototype.scrollIntoView = vi.fn()
  fireEvent.keyDown(category, { key: 'ArrowDown' })
  fireEvent.keyDown(await screen.findByRole('option', { name: 'No category' }), { key: 'Enter' })
  fireEvent.change(screen.getByLabelText('Meta Title'), { target: { value: '' } })
  fireEvent.change(screen.getByLabelText('Meta Description'), { target: { value: '   ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
  await waitFor(() => expect(router.push).toHaveBeenCalled())
  expect(updates).toHaveLength(1)
  expect(updates[0]).toMatchObject({ category_id: null, meta_title: null, meta_description: null })
})

it('saves one override independently and omits untouched fields', async () => {
  const updates = await openEditor()
  fireEvent.change(screen.getByLabelText('Meta Description'), { target: { value: '  New description  ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
  await waitFor(() => expect(router.push).toHaveBeenCalled())
  expect(updates[0].meta_description).toBe('New description')
  expect(updates[0]).not.toHaveProperty('category_id')
  expect(updates[0]).not.toHaveProperty('meta_title')
})
