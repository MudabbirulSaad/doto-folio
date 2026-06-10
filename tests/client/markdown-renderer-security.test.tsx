import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'

describe('shared markdown renderer security policies', () => {
  it('renders user comment markdown with safe GFM features and UGC links', () => {
    render(
      <MarkdownRenderer
        source={`A [link](https://example.com), *em*, _also em_, and \`code\`.

\`\`\`ts
const value = 1
\`\`\`

- one
- two`}
        policy="userComment"
        mode="comment"
      />
    )

    const link = screen.getByRole('link', { name: 'link' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow ugc')
    expect(screen.getByText('em').tagName.toLowerCase()).toBe('em')
    expect(screen.getByText('also em').tagName.toLowerCase()).toBe('em')
    expect(screen.getByText('code').tagName.toLowerCase()).toBe('code')
    expect(screen.getByText(/const value = 1/)).toBeInTheDocument()
    expect(screen.getByText('one').tagName.toLowerCase()).toBe('li')
  })

  it('does not render unsafe comment HTML, images, event handlers, or javascript links', () => {
    render(
      <MarkdownRenderer
        source={'<img src=x onerror="alert(1)"> <span onclick="alert(1)">raw</span> [bad](javascript:alert(1))'}
        policy="userComment"
        mode="comment"
      />
    )

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText(/raw/)).not.toHaveAttribute('onclick')
    expect(screen.getByText('bad').tagName.toLowerCase()).not.toBe('a')
  })
})
