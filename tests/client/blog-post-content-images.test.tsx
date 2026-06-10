import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BlogPostContent } from '@/components/blog/blog-post-content'
import type { BlogPostWithRelations } from '@/lib/types/blog'

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string } & Record<string, unknown>) =>
    React.createElement('img', {
      ...props,
      src,
      alt,
      'data-next-image': 'true'
    })
}))

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    fromTo: vi.fn()
  }
}))

vi.mock('gsap/dist/ScrollTrigger', () => ({
  ScrollTrigger: {
    getAll: () => []
  }
}))

function post(content: string): BlogPostWithRelations {
  return {
    id: 'post-1',
    title: 'Image Post',
    slug: 'image-post',
    excerpt: 'Images in markdown',
    content,
    author_name: 'Author',
    author_bio: 'Bio',
    status: 'published',
    featured: false,
    view_count: 1,
    reading_time: 1,
    published_at: '2026-06-09T00:00:00.000Z',
    created_at: '2026-06-09T00:00:00.000Z',
    updated_at: '2026-06-09T00:00:00.000Z',
    category: null,
    tags: []
  }
}

describe('blog post content images', () => {
  it('renders local markdown images through the optimized image boundary', () => {
    render(<BlogPostContent post={post('![Architecture diagram](/images/architecture.png)')} />)

    const image = screen.getByRole('img', { name: 'Architecture diagram' })

    expect(image).toHaveAttribute('src', '/images/architecture.png')
    expect(image).toHaveAttribute('data-next-image', 'true')
    expect(screen.getByText('Architecture diagram')).toBeInTheDocument()
  })

  it('keeps unknown external markdown images renderable through the fallback boundary', () => {
    render(<BlogPostContent post={post('![Remote diagram](https://cdn.example.com/diagram.png)')} />)

    const image = screen.getByRole('img', { name: 'Remote diagram' })

    expect(image).toHaveAttribute('src', 'https://cdn.example.com/diagram.png')
    expect(image).not.toHaveAttribute('data-next-image')
    expect(screen.getByText('Remote diagram')).toBeInTheDocument()
  })
})

describe('blog post markdown security', () => {
  it('renders Editor.js inline code markup as inline code instead of raw text', () => {
    render(<BlogPostContent post={post(JSON.stringify({
      time: Date.now(),
      version: '2.28.2',
      blocks: [
        {
          type: 'paragraph',
          data: {
            text: 'Read <code class="inline-code">skill.md</code> before joining.'
          }
        }
      ]
    }))} />)

    expect(screen.queryByText(/<code class="inline-code">skill\.md<\/code>/)).not.toBeInTheDocument()
    expect(screen.getByText('skill.md').tagName.toLowerCase()).toBe('code')
  })

  it('renders trusted blog markdown with GFM features', () => {
    render(<BlogPostContent post={post(`Use \`skill.md\` and:

\`\`\`ts
const ok = true
\`\`\`

[Portfolio](https://mudabbirulsaad.com)

*italic* _also italic_

- One
- Two

| A | B |
| - | - |
| 1 | 2 |

> Quote`)} />)

    expect(screen.getByText('skill.md').tagName.toLowerCase()).toBe('code')
    expect(screen.getByText('const ok = true')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Portfolio' })).toHaveAttribute('href', 'https://mudabbirulsaad.com')
    expect(screen.getByText('italic').tagName.toLowerCase()).toBe('em')
    expect(screen.getByText('also italic').tagName.toLowerCase()).toBe('em')
    expect(screen.getByText('One').tagName.toLowerCase()).toBe('li')
    expect(screen.getByText('A').tagName.toLowerCase()).toBe('th')
    expect(screen.getByText('Quote')).toBeInTheDocument()
  })

  it('removes unsafe trusted blog HTML', () => {
    render(<BlogPostContent post={post('<script>alert(1)</script><p onclick="alert(1)">Safe</p><a href="javascript:alert(1)">bad</a>')} />)

    expect(screen.queryByText('alert(1)')).not.toBeInTheDocument()
    expect(screen.getByText('Safe')).not.toHaveAttribute('onclick')
    expect(screen.getByText('bad')).not.toHaveAttribute('href', 'javascript:alert(1)')
  })
})
