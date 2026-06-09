import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BlogFilters } from '@/components/blog/blog-filters'

const pushMock = vi.fn()
const replaceMock = vi.fn()
let currentSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock
  }),
  useSearchParams: () => currentSearchParams
}))

vi.mock('gsap', () => ({
  gsap: {
    fromTo: vi.fn(),
    to: vi.fn()
  }
}))

function renderFilters(props: Partial<Parameters<typeof BlogFilters>[0]> = {}) {
  render(
    <BlogFilters
      categories={[]}
      tags={[]}
      selectedCategory={undefined}
      selectedTag={undefined}
      {...props}
    />
  )
}

describe('blog search routing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    currentSearchParams = new URLSearchParams()
    pushMock.mockClear()
    replaceMock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('syncs debounced search to the URL without navigation-style page reload semantics', async () => {
    renderFilters()

    fireEvent.change(screen.getByPlaceholderText('Search articles...'), {
      target: { value: 'architecture' }
    })

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    expect(replaceMock).toHaveBeenCalledWith('/blog?query=architecture', { scroll: false })
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('syncs submitted search immediately without push navigation', () => {
    renderFilters()

    const searchInput = screen.getByPlaceholderText('Search articles...')
    fireEvent.change(searchInput, {
      target: { value: 'testing' }
    })
    fireEvent.submit(searchInput.closest('form')!)

    expect(replaceMock).toHaveBeenCalledWith('/blog?query=testing', { scroll: false })
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('renders the current query from the URL', () => {
    currentSearchParams = new URLSearchParams('query=existing')

    renderFilters()

    expect(screen.getByPlaceholderText('Search articles...')).toHaveValue('existing')
  })

  it('preserves unrelated params and resets page when category changes', () => {
    currentSearchParams = new URLSearchParams('query=testing&page=3&tag=react')

    renderFilters({
      categories: [{
        id: 'category-1',
        name: 'Architecture',
        slug: 'architecture',
        color: '#22c55e',
        display_order: 1,
        is_published: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z'
      }]
    })

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.click(screen.getByRole('button', { name: 'Architecture' }))

    expect(replaceMock).toHaveBeenCalledWith('/blog?query=testing&tag=react&category=architecture', { scroll: false })
  })

  it('clears filters without push navigation', () => {
    renderFilters({
      categories: [{
        id: 'category-1',
        name: 'Architecture',
        slug: 'architecture',
        color: '#22c55e',
        display_order: 1,
        is_published: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z'
      }],
      selectedCategory: 'architecture'
    })

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))

    expect(replaceMock).toHaveBeenCalledWith('/blog', { scroll: false })
    expect(pushMock).not.toHaveBeenCalled()
  })
})
