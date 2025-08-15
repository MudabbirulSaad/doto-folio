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
  X
} from 'lucide-react'

export default function AdminNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
      name: 'Contact Submissions',
      href: '/admin/contacts',
      icon: Mail,
      current: pathname === '/admin/contacts'
    }
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-lg text-foreground">SAAD Admin</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Back to Portfolio */}
            <Link href="/">
              <Button variant="ghost" size="sm" className="hidden sm:flex items-center space-x-2">
                <Home className="w-4 h-4" />
                <span>Portfolio</span>
              </Button>
            </Link>

            {/* User Info */}
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{userEmail}</span>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isLoading ? 'Signing Out...' : 'Sign Out'}
              </span>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              
              {/* Mobile User Info */}
              <div className="px-3 py-2 text-sm text-muted-foreground border-t border-border mt-2 pt-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{userEmail}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
