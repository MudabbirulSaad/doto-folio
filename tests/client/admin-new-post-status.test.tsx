import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { OutputData } from '@editorjs/editorjs'
import { expect, it, vi } from 'vitest'
import NewPostPage from '@/app/admin/blog/posts/new/page'

const { createPost } = vi.hoisted(() => ({ createPost: vi.fn() }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/lib/client/adapters/http/admin-blog-api', () => ({
  createAdminBlogPostApiGateway: () => ({ createPost }),
  createAdminBlogTaxonomyApiGateway: () => ({
    listCategories: async () => [],
    listTags: async () => []
  })
}))
vi.mock('next/dynamic', () => ({
  default: () => function TestEditor({ onChange }: { onChange: (data: OutputData) => void }) {
    return <textarea aria-label="Post body" onChange={event => onChange({
      blocks: [{ type: 'paragraph', data: { text: event.target.value } }]
    })} />
  }
}))

it.each([
  { action: 'Save Draft', expectedStatus: 'draft' },
  { action: 'Publish', expectedStatus: 'published' }
])('$action creates a $expectedStatus post', async ({ action, expectedStatus }) => {
  createPost.mockClear()
  render(<NewPostPage />)
  fireEvent.change(screen.getByPlaceholderText('Untitled'), { target: { value: 'A working draft' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Post body' }), { target: { value: 'Article text' } })

  // Exercise the conflicting sidebar choice for each explicit action.
  if (action === 'Save Draft') {
    // Radix scrolls the focused option into view, which jsdom does not implement.
    HTMLElement.prototype.scrollIntoView = vi.fn()
    const statusSelect = screen.getByRole('combobox')
    fireEvent.keyDown(statusSelect, { key: 'ArrowDown' })
    fireEvent.keyDown(await screen.findByRole('option', { name: 'Published' }), { key: 'Enter' })
    expect(statusSelect).toHaveTextContent('Published')
  }

  fireEvent.click(screen.getByRole('button', { name: action }))
  await waitFor(() => expect(createPost).toHaveBeenCalledWith(expect.objectContaining({
    slug: 'a-working-draft',
    status: expectedStatus
  })))
})
