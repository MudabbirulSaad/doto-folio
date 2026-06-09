import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ContentManagementPage from '@/app/admin/content/page'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>
  }
}))

describe('admin content navigation', () => {
  it('links only to implemented content management pages', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      success: true,
      data: {
        projectsCount: 1,
        skillsCount: 2,
        contactMethodsCount: 3,
        socialLinksCount: 4,
        isContentPublished: true,
        commentsCount: 5
      }
    }))))

    render(<ContentManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('7 Links')).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: /Contact & Social/ })).toHaveAttribute('href', '/admin/content/contact')
    expect(screen.queryByRole('link', { name: /Site Settings/ })).not.toBeInTheDocument()
  })
})
