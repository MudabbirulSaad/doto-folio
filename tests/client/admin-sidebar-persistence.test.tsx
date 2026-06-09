import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminLayout from '@/app/admin/layout'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/dashboard',
  useRouter: () => ({
    push: pushMock
  })
}))

vi.mock('@/components/section-nebula', () => ({
  SectionNebula: () => <div data-testid="section-nebula" />
}))

vi.mock('@/lib/auth/admin', () => ({
  getCurrentSession: vi.fn(async () => ({
    user: { email: 'admin@example.com' }
  })),
  logoutAdmin: vi.fn()
}))

function renderAdminLayout() {
  return render(
    <AdminLayout>
      <div>Dashboard content</div>
    </AdminLayout>
  )
}

describe('admin sidebar persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    pushMock.mockClear()
  })

  it('uses the stored collapsed state for layout spacing and navigation', async () => {
    localStorage.setItem('admin-sidebar-collapsed', 'true')

    const { container } = renderAdminLayout()

    await waitFor(() => {
      expect(container.querySelector('main')).toHaveClass('md:ml-16')
      expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()
    })
  })

  it('persists sidebar toggles from navigation', () => {
    const { container } = renderAdminLayout()

    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))

    expect(localStorage.getItem('admin-sidebar-collapsed')).toBe('true')
    expect(container.querySelector('main')).toHaveClass('md:ml-16')
  })

  it('syncs sidebar state when another tab updates storage', async () => {
    const { container } = renderAdminLayout()

    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'admin-sidebar-collapsed',
        newValue: 'true'
      }))
    })

    await waitFor(() => {
      expect(container.querySelector('main')).toHaveClass('md:ml-16')
      expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()
    })
  })
})
