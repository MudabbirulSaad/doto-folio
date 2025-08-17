'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { logoutAdmin } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Mail,
  LogOut,
  User,
  Home,
  Menu,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  PenTool,
  FolderOpen,
  Tags,
  BookOpen
} from 'lucide-react'

export default function AdminNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('admin-sidebar-collapsed')
    if (savedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedState))
    }
  }, [])

  // Save sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(newState))
  }

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setUserEmail(session.user.email)
      }
    }
    getUser()
  }, [])

  // Only show navigation on admin routes (except login page) - moved after all hooks
  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return null
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logoutAdmin()
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/admin/dashboard'
    },
    {
      name: 'Blog Posts',
      href: '/admin/blog/posts',
      icon: BookOpen,
      current: pathname.startsWith('/admin/blog/posts')
    },
    {
      name: 'New Post',
      href: '/admin/blog/posts/new',
      icon: PenTool,
      current: pathname === '/admin/blog/posts/new'
    },
    {
      name: 'Categories',
      href: '/admin/blog/categories',
      icon: FolderOpen,
      current: pathname.startsWith('/admin/blog/categories')
    },
    {
      name: 'Tags',
      href: '/admin/blog/tags',
      icon: Tags,
      current: pathname.startsWith('/admin/blog/tags')
    },
    {
      name: 'Content Management',
      href: '/admin/content',
      icon: FileText,
      current: pathname.startsWith('/admin/content')
    },
    {
      name: 'Contact Submissions',
      href: '/admin/contacts',
      icon: Mail,
      current: pathname === '/admin/contacts'
    }
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`admin-sidebar fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'admin-sidebar-collapsed' : 'admin-sidebar-expanded'
        } hidden md:flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link
            href="/admin/dashboard"
            className={`flex items-center transition-all duration-300 ${
              isSidebarCollapsed ? 'justify-center' : 'space-x-3'
            }`}
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            {!isSidebarCollapsed && (
              <span className="font-bold text-lg text-foreground whitespace-nowrap">
                SAAD Admin
              </span>
            )}
          </Link>

          {!isSidebarCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="flex-shrink-0"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`admin-sidebar-item nav-item-glass relative flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 group ${
                  item.current
                    ? 'active bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                } ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
                title={isSidebarCollapsed ? item.name : undefined}
              >
                <Icon className={`flex-shrink-0 transition-transform duration-200 ${
                  item.current ? 'w-5 h-5' : 'w-4 h-4 group-hover:scale-110'
                }`} />
                {!isSidebarCollapsed && (
                  <span className="whitespace-nowrap">{item.name}</span>
                )}
                {isSidebarCollapsed && (
                  <div className="sidebar-tooltip">
                    {item.name}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border space-y-2">
          {/* Portfolio Link */}
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className={`w-full transition-all duration-200 ${
                isSidebarCollapsed ? 'px-2' : 'justify-start'
              }`}
              title={isSidebarCollapsed ? 'Portfolio' : undefined}
            >
              <Home className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="ml-2">Portfolio</span>}
            </Button>
          </Link>

          {/* User Info */}
          {!isSidebarCollapsed && userEmail && (
            <div className="flex items-center space-x-2 px-3 py-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{userEmail}</span>
            </div>
          )}

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoading}
            className={`w-full transition-all duration-200 ${
              isSidebarCollapsed ? 'px-2' : 'justify-start'
            }`}
            title={isSidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isSidebarCollapsed && (
              <span className="ml-2">
                {isLoading ? 'Signing Out...' : 'Sign Out'}
              </span>
            )}
          </Button>
        </div>

        {/* Collapse Button (when collapsed) */}
        {isSidebarCollapsed && (
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="w-full"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Top Navigation */}
      <nav className="admin-mobile-nav fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border md:hidden">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Mobile Logo */}
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg text-foreground">SAAD Admin</span>
          </Link>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="admin-touch-target"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-border bg-card/95 backdrop-blur-sm">
            <div className="px-4 py-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`nav-item-glass admin-touch-target flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      item.current
                        ? 'active bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}

              {/* Mobile Actions */}
              <div className="pt-3 mt-3 border-t border-border space-y-1">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="w-full justify-start admin-touch-target">
                    <Home className="w-4 h-4 mr-3" />
                    Portfolio
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="w-full justify-start admin-touch-target"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  {isLoading ? 'Signing Out...' : 'Sign Out'}
                </Button>

                {userEmail && (
                  <div className="flex items-center space-x-2 px-3 py-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg">
                    <User className="w-3 h-3" />
                    <span className="truncate">{userEmail}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
