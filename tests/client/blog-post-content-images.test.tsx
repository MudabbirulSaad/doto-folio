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
