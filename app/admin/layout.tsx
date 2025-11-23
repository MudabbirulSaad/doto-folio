'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import AdminNavigation from '@/components/admin/admin-navigation'
import { SectionNebula } from '@/components/section-nebula'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Sync with sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('admin-sidebar-collapsed')
    if (savedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedState))
    }

    // Listen for storage changes to sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin-sidebar-collapsed' && e.newValue !== null) {
        setIsSidebarCollapsed(JSON.parse(e.newValue))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Authentication is handled by middleware
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Cosmic Background */}
      <SectionNebula className="fixed inset-0 z-0 opacity-50" />

      {/* Admin Navigation */}
      <AdminNavigation />

      {/* Main Content */}
      <main
        className={`admin-content-area relative z-10 transition-all duration-300 ease-in-out pt-16 md:pt-0 admin-mobile-spacing ${isSidebarCollapsed
          ? 'md:ml-16' // 4rem when collapsed
          : 'md:ml-64' // 16rem when expanded
          }`}
      >
        <div className="min-h-screen px-4 md:px-6 lg:px-8 py-4 md:py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
