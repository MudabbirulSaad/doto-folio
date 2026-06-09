'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCurrentSession, logoutAdmin } from '@/lib/auth/admin'
import { useAdminSidebarCollapsed } from '@/components/admin/use-admin-sidebar-collapsed'
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
  BookOpen,
  Code2,
  Briefcase,
  MessageSquare,
  Bot
} from 'lucide-react'

export default function AdminNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useAdminSidebarCollapsed()

  // Save sidebar state to localStorage
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  useEffect(() => {
    const getUser = async () => {
      const session = await getCurrentSession()
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
      // Optimistic navigation - move to login immediately
      router.push('/admin/login')

      // Perform logout in background
      await logoutAdmin()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // No need to set loading false as we navigated away
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
      name: 'Projects',
      href: '/admin/content/projects',
      icon: Briefcase,
      current: pathname.startsWith('/admin/content/projects')
    },
    {
      name: 'Skills',
      href: '/admin/content/skills',
      icon: Code2,
      current: pathname.startsWith('/admin/content/skills')
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
      name: 'Site Content',
      href: '/admin/content',
      icon: FileText,
      current: pathname === '/admin/content'
    },
    {
      name: 'Comments',
      href: '/admin/comments',
      icon: MessageSquare,
      current: pathname.startsWith('/admin/comments')
    },
    {
      name: 'Contact Submissions',
      href: '/admin/contacts',
      icon: Mail,
      current: pathname === '/admin/contacts'
    },
    {
      name: 'Agents',
      href: '/admin/agents',
      icon: Bot,
      current: pathname.startsWith('/admin/agents')
    }
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`admin-sidebar fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'admin-sidebar-collapsed' : 'admin-sidebar-expanded'
          } hidden md:flex flex-col border-r border-white/10 bg-black/20 backdrop-blur-xl`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link
            href="/admin/dashboard"
            className={`flex items-center transition-all duration-300 ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'
              }`}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-sm">S</span>
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
              className="flex-shrink-0 hover:bg-white/5"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`admin-sidebar-item nav-item-glass relative flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 group ${item.current
                  ? 'active bg-primary/20 text-primary border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.2)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  } ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
                title={isSidebarCollapsed ? item.name : undefined}
              >
                <Icon className={`flex-shrink-0 transition-transform duration-200 ${item.current ? 'w-5 h-5' : 'w-4 h-4 group-hover:scale-110'
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
        <div className="p-4 border-t border-white/10 space-y-2 bg-black/10">
          {/* Portfolio Link */}
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className={`w-full transition-all duration-200 hover:bg-white/5 ${isSidebarCollapsed ? 'px-2' : 'justify-start'
                }`}
              title={isSidebarCollapsed ? 'Portfolio' : undefined}
            >
              <Home className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="ml-2">Portfolio</span>}
            </Button>
          </Link>

          {/* User Info */}
          {!isSidebarCollapsed && userEmail && (
            <div className="flex items-center space-x-2 px-3 py-2 text-xs text-muted-foreground bg-white/5 rounded-lg border border-white/5">
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
            className={`w-full transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 ${isSidebarCollapsed ? 'px-2' : 'justify-start'
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
          <div className="p-2 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="w-full hover:bg-white/5"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Top Navigation */}
      <nav className="admin-mobile-nav fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/10 md:hidden">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Mobile Logo */}
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg text-foreground">SAAD Admin</span>
          </Link>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="admin-touch-target hover:bg-white/5"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-white/10 bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-2">
            <div className="px-4 py-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`nav-item-glass admin-touch-target flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${item.current
                      ? 'active bg-primary/20 text-primary border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}

              {/* Mobile Actions */}
              <div className="pt-3 mt-3 border-t border-white/10 space-y-1">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="w-full justify-start admin-touch-target hover:bg-white/5">
                    <Home className="w-4 h-4 mr-3" />
                    Portfolio
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="w-full justify-start admin-touch-target hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  {isLoading ? 'Signing Out...' : 'Sign Out'}
                </Button>

                {userEmail && (
                  <div className="flex items-center space-x-2 px-3 py-2 text-xs text-muted-foreground bg-white/5 rounded-lg border border-white/5 mt-2">
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
