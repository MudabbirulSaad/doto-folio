'use client'

import { useState, useEffect } from 'react'
import AdminNavigation from '@/components/admin/admin-navigation'

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

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Navigation */}
      <AdminNavigation />

      {/* Main Content */}
      <main
        className={`admin-content-area transition-all duration-300 ease-in-out pt-16 md:pt-0 admin-mobile-spacing ${
          isSidebarCollapsed
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
