import { Suspense } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import EditPostPage from '@/app/admin/blog/posts/[id]/edit/page'
import { RichContentRenderer } from '@/components/markdown/markdown-renderer'

const { router } = vi.hoisted(() => ({ router: { push: vi.fn() } }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

const markdown = [
  '| Service | Rollout | Owner |',
  '| :--- | ---: | --- |',
  '| Search \\| indexing | **25%** | Zoë |',
  '| Archive | 0% | |',
  ''
].join('\n')

afterEach(() => vi.unstubAllGlobals())

it('preserves the original Markdown table across a title-only save, reopen and public render', async () => {
  let post = {
    id: 'legacy-table', title: 'Rollout', slug: 'rollout', status: 'published',
    content: markdown, excerpt: null, featured: false, tags: []
  }
  const updates: Record<string, unknown>[] = []
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    if (url === '/api/admin/blog/posts/legacy-table') {
      if (init?.method === 'PUT') {
        const update = JSON.parse(String(init.body))
        updates.push(update)
        post = { ...post, ...update }
      }
      return Response.json({ data: post })
    }
    return Response.json({ data: [] })
  })

  function openEditor() {
    return render(<Suspense><EditPostPage params={Promise.resolve({ id: post.id })} /></Suspense>)
  }
  async function checkTable() {
    const rows = within(await screen.findByRole('table')).getAllByRole('row')
    expect(rows.map(row => Array.from(row.children, cell => cell.textContent))).toEqual([
      ['Service', 'Rollout', 'Owner'],
      ['Search | indexing', '25%', 'Zoë'],
      ['Archive', '0%', '']
    ])
    expect(within(rows[0]).getAllByRole('columnheader')).toHaveLength(3)
    expect(within(rows[1]).getByText('25%').tagName).toBe('STRONG')
  }

  const editor = await act(async () => openEditor())
  await checkTable()
  fireEvent.change(screen.getByPlaceholderText('Post Title'), { target: { value: 'Updated rollout' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
  await waitFor(() => expect(updates).toHaveLength(1))
  expect(updates[0]).not.toHaveProperty('content')
  expect(updates[0]).not.toHaveProperty('excerpt')
  expect(post.content).toBe(markdown)
  editor.unmount()

  const reopened = await act(async () => openEditor())
  await checkTable()
  expect(screen.getByPlaceholderText('Post Title')).toHaveValue('Updated rollout')
  reopened.unmount()
  render(<RichContentRenderer content={post.content} policy="trustedBlog" />)
  await checkTable()
})
